import { test, expect, type Page } from '@playwright/test'

async function observed(page: Page) {
  return page.evaluate(async () => {
    // @ts-expect-error Runtime Vite module, shared with the scene.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const { scene, camera, controls } = _roots.get(document.querySelector('canvas')).store.getState()
    const screen = scene.getObjectByName('monitor-screen')
    return { execution: screen.userData.executionState, texture: screen.material.map.uuid,
      text: screen.material.map.image.dataset.drawnText ?? '',
      flow: scene.getObjectByName('execution-visualization')?.userData.state,
      outbound: !!scene.getObjectByName('network-outbound'), inbound: !!scene.getObjectByName('network-inbound'),
      output: !!scene.getObjectByName('display-output-flow'),
      mode: camera.userData.mode, focus: camera.userData.focus, position: camera.position.toArray(), enabled: controls.enabled }
  })
}

test('browser and local network share ordered execution, screen and hardware state', async ({ page }, info) => {
  await page.addInitScript(() => {
    const rect = CanvasRenderingContext2D.prototype.fillRect, text = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillRect = function(x,y,w,h) { if(x===0&&y===0&&w===this.canvas.width&&h===this.canvas.height)this.canvas.dataset.drawnText=''; rect.call(this,x,y,w,h) }
    CanvasRenderingContext2D.prototype.fillText = function(value,x,y,max) { this.canvas.dataset.drawnText += '\n'+value; if(max===undefined)text.call(this,value,x,y);else text.call(this,value,x,y,max) }
  })
  const requests: string[] = [], errors: string[] = []
  page.on('request', request => { if (request.url().includes('example.com')) requests.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  const launch = page.getByRole('button', { name:'LAUNCH BROWSER', exact:true })
  const network = page.getByRole('button', { name:'LOAD WEBSITE', exact:true })
  const panel = page.getByRole('region', { name:'Program execution' })
  await expect(launch).toBeDisabled(); await expect(network).toBeDisabled()
  await page.getByRole('button', { name:'POWER ON', exact:true }).click()
  await expect(launch).toBeDisabled()
  await page.getByRole('button', { name:'SKIP TO RUNNING', exact:true }).click()
  await expect(launch).toBeEnabled()
  const texture = (await observed(page)).texture
  await launch.click()
  await expect.poll(async()=> (await observed(page)).focus).toBe('monitor')
  const app = ['USER_INPUT','OS_REQUEST','PROCESS_CREATION','STORAGE_READ','LOAD_TO_RAM','CPU_EXECUTION','GPU_RENDER','DISPLAY_OUTPUT','APP_READY']
  for (const state of app) {
    await expect(panel).toHaveAttribute('data-execution-state',state,{timeout:7000})
    await expect.poll(async()=> (await observed(page)).execution).toBe(state)
    const actual=await observed(page)
    expect(actual.flow).toBe(state); expect(actual.texture).toBe(texture)
    if(state!=='APP_READY')await expect(network).toBeDisabled()
    if(state==='STORAGE_READ')expect(actual.text).toContain('Starting Browser')
    if(state==='DISPLAY_OUTPUT')expect(actual.output).toBe(true)
  }
  await expect(network).toBeEnabled()
  expect((await observed(page)).text).toContain('New tab')
  await network.click()
  for(const state of ['NETWORK_REQUEST','NETWORK_OUTBOUND','NETWORK_RESPONSE','NETWORK_PROCESSING','PAGE_RENDER','PAGE_READY']) {
    await expect(panel).toHaveAttribute('data-execution-state',state,{timeout:7000})
    await expect.poll(async()=> (await observed(page)).execution).toBe(state)
    const actual=await observed(page)
    expect(actual.flow).toBe(state)
    if(state==='NETWORK_OUTBOUND'){expect(actual.outbound).toBe(true);expect(actual.output).toBe(false)}
    if(state==='NETWORK_RESPONSE'){expect(actual.inbound).toBe(true);expect(actual.output).toBe(false)}
  }
  expect((await observed(page)).text).toContain('Page loaded successfully')
  expect(requests).toEqual([])
  await page.screenshot({path:info.outputPath('page-ready.png')})
  await page.mouse.move(1080,600);await page.mouse.down();await page.mouse.move(1170,650,{steps:12});await page.mouse.up()
  await page.waitForTimeout(2200)
  const moved=await observed(page)
  expect(moved.mode).toBe('manual');expect(moved.enabled).toBe(true)
  await page.waitForTimeout(1500)
  const later=await observed(page)
  expect(Math.hypot(...later.position.map((v:number,i:number)=>v-moved.position[i]))).toBeLessThan(.02)
  await page.getByRole('button',{name:'RESTART DEMO',exact:true}).click()
  await expect(panel).toHaveAttribute('data-execution-state','USER_INPUT')
  await expect(page.locator('main')).toHaveAttribute('data-system-phase','running')
  await expect(network).toBeDisabled()
  await page.getByRole('button',{name:'SHUT DOWN',exact:true}).click()
  await expect(panel).toHaveAttribute('data-execution-state','IDLE')
  await expect(launch).toBeDisabled()
  await page.getByRole('button',{name:'SKIP TO RUNNING',exact:true}).click()
  await expect(launch).toBeEnabled();await expect(network).toBeDisabled()
  expect((await observed(page)).execution).toBe('IDLE')
  expect(errors).toEqual([])
})
