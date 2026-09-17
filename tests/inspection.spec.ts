import { test, expect, type Page } from '@playwright/test'

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    // Inspect the actual R3F store; no alternate test camera or simulated input.
    // @ts-expect-error Vite serves the browser dependency at runtime.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const root = _roots.get(document.querySelector('canvas'))
    if (!root) return { mode: 'mounting' }
    const state = root.store.getState()
    const { camera, controls, scene } = state
    return { position: camera.position.toArray(), target: controls.target.toArray(), quaternion: camera.quaternion.toArray(), mode: camera.userData.mode, focus: camera.userData.focus, path: camera.userData.path, enabled: controls.enabled, glass: !!scene.getObjectByName('glass-panel'), temperature: scene.getObjectByName('aio-display')?.userData.temperature }
  })
}

test('inspect every component, release orbit for 10 seconds, reset, modes and boot', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => {
    // R3F 9 constructs THREE.Clock internally; r186 emits this upstream deprecation.
    if ((m.type() === 'error' || m.type() === 'warning') && !m.text().startsWith('THREE.Clock:')) errors.push(m.text())
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect.poll(async () => (await snapshot(page)).mode, { timeout: 30_000 }).toBe('manual')
  await page.screenshot({ path: testInfo.outputPath('internal.png') })
  expect((await snapshot(page)).glass).toBe(false)
  for (const [label, id] of [['CPU', 'cpu'], ['GPU', 'gpu'], ['RAM', 'ram'], ['MAINBOARD', 'motherboard'], ['SSD', 'ssd'], ['PSU', 'psu'], ['COOLING', 'cooling']]) {
    await page.locator('.component').filter({ has: page.locator('b', { hasText: new RegExp(`^${label}$`) }) }).click()
    await expect.poll(async () => { const s = await snapshot(page); return `${s.focus}:${s.mode}` }, { timeout: 30_000 }).toBe(`${id}:manual`)
    const focused = await snapshot(page)
    expect(focused.enabled).toBe(true)
    const localZ = -Math.sin(.34) * focused.position[0] + Math.cos(.34) * focused.position[2]
    expect(localZ).toBeGreaterThan(4.3)
    await page.screenshot({ path: testInfo.outputPath(`${id}.png`) })
    await page.mouse.move(740, 410)
    await page.mouse.down()
    await page.mouse.move(890, 490, { steps: 25 })
    await page.mouse.up()
    await page.waitForTimeout(2500)
    const released = await snapshot(page)
    expect(released.position).not.toEqual(focused.position)
    expect(released.focus).toBe(id)
    await page.waitForTimeout(10_000)
    const later = await snapshot(page)
    const movement = Math.hypot(...later.position.map((n: number, i: number) => n - released.position[i]))
    expect(movement, `${id} must remain where manual orbit left it`).toBeLessThan(.01)
    expect(later.mode).toBe('manual')
    await page.mouse.wheel(0, -150)
    await page.waitForTimeout(500)
    expect((await snapshot(page)).position).not.toEqual(later.position)
  }
  await page.getByRole('button', { name: 'RESET VIEW' }).click()
  await expect.poll(async () => { const s = await snapshot(page); return `${s.focus}:${s.mode}` }).toBe('hero:manual')
  await page.getByRole('button', { name: 'EXTERNAL', exact: true }).click()
  await expect.poll(async () => (await snapshot(page)).glass).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('external.png') })
  await page.getByRole('button', { name: 'INTERNAL', exact: true }).click()
  await page.locator('.component').filter({ hasText: 'CPU' }).click()
  await expect.poll(async () => { const s = await snapshot(page); return `${s.focus}:${s.mode}` }, { timeout: 30_000 }).toBe('cpu:manual')
  await page.getByRole('button', { name: 'EXPLODED VIEW' }).click()
  await page.screenshot({ path: testInfo.outputPath('cpu-exploded.png') })
  await page.getByRole('button', { name: 'ASSEMBLE VIEW' }).click()
  await page.getByRole('button', { name: 'DATA FLOW' }).click()
  await page.getByRole('button', { name: 'POWER FLOW' }).click()
  await page.getByRole('button', { name: 'POWER ON' }).click()
  await expect(page.getByTestId('phase-card')).toBeVisible()
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'psuStarting')
  await page.getByRole('button', { name: 'SKIP TO RUNNING' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'running')
  await page.getByRole('button', { name: 'ARCHITECTURE', exact: true }).click()
  await expect(page.locator('.arch-diagram')).toBeVisible()
  await page.getByRole('button', { name: 'RETURN TO LAB' }).click()
  expect(errors).toEqual([])
})

test('shared thermal response, fan animation, display and gesture-started audio', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext
    const graphs: AudioContext[] = []
    const gains: GainNode[] = []
    Object.assign(window, { audioTest: { graphs, gains } })
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) { super(options); graphs.push(this) }
      createGain() { const gain = super.createGain(); gains.push(gain); return gain }
    }
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect.poll(async () => (await snapshot(page)).mode, { timeout: 30_000 }).toBe('manual')
  await page.getByRole('button', { name: 'SKIP TO RUNNING' }).click()
  const audio = () => page.evaluate(() => {
    const data = (window as unknown as { audioTest: { graphs: AudioContext[]; gains: GainNode[] } }).audioTest
    return { count: data.graphs.length, state: data.graphs[0]?.state, gains: data.gains.map(g => g.gain.value) }
  })
  expect((await audio()).count).toBe(0)
  await page.getByRole('button', { name: 'SOUND OFF' }).click()
  await expect.poll(async () => (await audio()).state).toBe('running')
  const readings = []
  for (const mode of ['IDLE', 'NORMAL', 'HIGH', 'IDLE']) {
    await page.getByRole('button', { name: mode, exact: true }).click()
    await page.waitForTimeout(30_000)
    const rpm = Number((await page.locator('.io-row').filter({ hasText: 'COOLING' }).locator('b').innerText()).split(' ')[0])
    const temperature = Number((await page.locator('.metric').first().locator('small').innerText()).split('°')[0])
    expect((await snapshot(page)).temperature).toBe(temperature)
    readings.push({ mode, rpm, temperature, audio: await audio() })
  }
  expect(readings[0].rpm).toBeLessThan(850)
  expect(readings[1].rpm).toBeGreaterThan(900)
  expect(readings[1].rpm).toBeLessThan(1350)
  expect(readings[2].rpm).toBeGreaterThan(1500)
  expect(readings[2].rpm).toBeLessThan(1950)
  expect(readings[3].rpm).toBeLessThan(900)
  expect(readings[2].audio.gains[1]).toBeGreaterThan(readings[1].audio.gains[1])
  expect(readings[1].audio.gains[1]).toBeGreaterThan(readings[0].audio.gains[1])
  await page.getByRole('button', { name: 'SOUND ON' }).click()
  await page.waitForTimeout(2000)
  expect((await audio()).gains[0]).toBeLessThan(.003)
  await testInfo.attach('thermal-and-audio-readings', { body: JSON.stringify(readings, null, 2), contentType: 'application/json' })
})
