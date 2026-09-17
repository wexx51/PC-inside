import { test, expect, type Page } from '@playwright/test'

async function state(page: Page) {
  return page.evaluate(async () => {
    // @ts-expect-error Vite serves the dependency in the browser.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const root = _roots.get(document.querySelector('canvas'))
    if (!root) return { mode: 'mounting' }
    const { camera, scene } = root.store.getState()
    const display = scene.getObjectByName('aio-display')
    const point = display.getWorldPosition(camera.position.clone()).project(camera)
    const rect = document.querySelector('canvas')!.getBoundingClientRect()
    const fans: number[] = []
    const angles: number[] = []
    scene.traverse((node: { name: string; userData: { rpm: number }; rotation: { z: number } }) => {
      if (node.name === 'fan') fans.push(node.userData.rpm)
      if (node.name === 'rotor') angles.push(node.rotation.z)
    })
    return {
      mode: camera.userData.mode, focus: camera.userData.focus, position: camera.position.toArray(),
      glass: !!scene.getObjectByName('glass-panel'), data: !!scene.getObjectByName('data-flow'), power: !!scene.getObjectByName('power-flow'),
      gpu: scene.getObjectByName('gpu-assembly').children.map((node: { position: { toArray: () => number[] } }) => node.position.toArray()),
      ramOffset: scene.getObjectByName('component-ram').children[0].position.z,
      fans, angles, displayPoint: [rect.x + (point.x + 1) * rect.width / 2, rect.y + (1 - point.y) * rect.height / 2],
      telemetryRpm: Number(document.querySelector('.io-row:last-child b')!.textContent!.split(' ')[0]),
    }
  })
}

test('case selection, sealed reset, scene picking, flows, exploded models and synchronized rotors', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect.poll(async () => (await state(page)).mode, { timeout: 30_000 }).toBe('manual')
  await page.getByRole('button', { name: 'SKIP TO RUNNING' }).click()
  await page.locator('.component').filter({ hasText: 'CASE' }).click()
  await expect.poll(async () => (await state(page)).focus).toBe('case')
  await page.getByRole('button', { name: 'EXTERNAL', exact: true }).click()
  await page.locator('.component').filter({ hasText: 'CASE' }).click()
  await expect.poll(async () => { const s = await state(page); return `${s.focus}:${s.mode}` }, { timeout: 15_000 }).toBe('case:manual')
  expect((await state(page)).glass).toBe(true)
  await page.getByRole('button', { name: 'RESET VIEW' }).click()
  await expect.poll(async () => { const s = await state(page); return `${s.focus}:${s.mode}` }, { timeout: 15_000 }).toBe('hero:manual')
  expect((await state(page)).glass).toBe(true)
  await page.locator('.component').filter({ hasText: 'CPU' }).click()
  await expect.poll(async () => { const s = await state(page); return `${s.focus}:${s.mode}` }, { timeout: 15_000 }).toBe('cpu:manual')
  expect((await state(page)).glass).toBe(false)
  const point = (await state(page)).displayPoint!
  await page.mouse.click(point[0], point[1])
  await expect.poll(async () => (await state(page)).focus).toBe('cooling')
  expect((await state(page)).data).toBe(true)
  await page.getByRole('button', { name: 'DATA FLOW' }).click()
  await expect.poll(async () => (await state(page)).data).toBe(false)
  await page.getByRole('button', { name: 'DATA FLOW' }).click()
  await page.getByRole('button', { name: 'POWER FLOW' }).click()
  await expect.poll(async () => (await state(page)).power).toBe(true)
  await page.getByRole('button', { name: 'POWER FLOW' }).click()
  await expect.poll(async () => (await state(page)).power).toBe(false)
  await page.locator('.component').filter({ hasText: 'GPU' }).click()
  const assembled = (await state(page)).gpu
  await page.getByRole('button', { name: 'EXPLODED VIEW' }).click()
  await expect.poll(async () => (await state(page)).gpu).not.toEqual(assembled)
  await page.getByRole('button', { name: 'ASSEMBLE VIEW' }).click()
  await expect.poll(async () => (await state(page)).gpu).toEqual(assembled)
  await page.locator('.component').filter({ hasText: 'MAINBOARD' }).click()
  await page.getByRole('button', { name: 'EXPLODED VIEW' }).click()
  await expect.poll(async () => (await state(page)).ramOffset).toBe(1)
  await page.getByRole('button', { name: 'ASSEMBLE VIEW' }).click()
  await expect.poll(async () => (await state(page)).ramOffset).toBe(0)
  const first = await state(page)
  expect(first.fans).toHaveLength(10)
  expect(first.fans!.every(rpm => Math.abs(Math.round(rpm) - first.telemetryRpm!) <= 1)).toBe(true)
  await page.waitForTimeout(500)
  expect((await state(page)).angles).not.toEqual(first.angles)
})

test('obstructed primary view selects a different angle on the open side', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect.poll(async () => (await state(page)).mode, { timeout: 30_000 }).toBe('manual')
  const primary = await page.evaluate(async () => {
    // @ts-expect-error Vite serves the dependency in the browser.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    // @ts-expect-error Vite transforms source modules.
    const { focusCandidates } = await import('/src/components/cameraPlan.ts')
    // @ts-expect-error Vite serves the dependency in the browser.
    const THREE = await import('/node_modules/.vite/deps/three.js')
    const { scene } = _roots.get(document.querySelector('canvas')).store.getState()
    const primary = focusCandidates('cpu')[0]
    const blocker = new THREE.Mesh(new THREE.BoxGeometry(.6, .6, .6), new THREE.MeshBasicMaterial())
    blocker.position.copy(primary.position).lerp(primary.target, .35)
    blocker.userData.cameraObstacle = true
    scene.add(blocker)
    return primary.position.toArray()
  })
  await page.locator('.component').filter({ hasText: 'CPU' }).click()
  await expect.poll(async () => { const s = await state(page); return `${s.focus}:${s.mode}` }, { timeout: 15_000 }).toBe('cpu:manual')
  const final = (await state(page)).position!
  expect(Math.hypot(...final.map((n: number, i: number) => n - primary[i]))).toBeGreaterThan(.1)
  expect(-Math.sin(.34) * final[0] + Math.cos(.34) * final[2]).toBeGreaterThan(4.3)
})

test('audio resume rejection remains muted without an unhandled error', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.addInitScript(() => {
    const Original = window.AudioContext
    window.AudioContext = class extends Original { resume() { return Promise.reject(new Error('Suspended by browser policy')) } }
  })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'SOUND OFF' }).click()
  await expect(page.getByRole('button', { name: 'SOUND OFF' })).toHaveAttribute('aria-pressed', 'false')
  expect(errors).toEqual([])
})
