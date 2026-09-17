import { test, expect, type Page } from '@playwright/test'

const phase = (page: Page) => page.locator('main').getAttribute('data-system-phase')

test('tour switch restores overview and explanation stays dismissed across phases', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect.poll(async () => (await sceneState(page))?.cameraMode).toBe('manual')
  const initial = (await sceneState(page))!.cameraPosition
  await page.getByRole('button', { name: 'GUIDED TOUR', exact: true }).click()
  await expect.poll(async () => (await sceneState(page))?.cameraMode).toBe('tourTransition')
  await page.getByRole('button', { name: 'AUTO TOUR ON', exact: true }).click()
  await expect(page.locator('main')).toHaveAttribute('data-camera-tour', 'manual')
  await expect.poll(async () => (await sceneState(page))?.cameraMode).toBe('manual')
  const restored = (await sceneState(page))!.cameraPosition
  expect(Math.hypot(...restored.map((n: number, i: number) => n - initial[i]))).toBeLessThan(.01)
  await page.getByRole('button', { name: 'Close explanation', exact: true }).click()
  await expect(page.getByTestId('phase-card')).toHaveCount(0)
  await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
  await expect(page.getByTestId('phase-card')).toHaveCount(0)
  await page.getByRole('button', { name: 'EXPLAIN MODE', exact: true }).click()
  await expect(page.getByTestId('phase-card')).toBeVisible()
  await page.getByRole('button', { name: 'Close explanation', exact: true }).click()
  await page.screenshot({ path: testInfo.outputPath('narrow-case.png') })
})

async function sceneState(page: Page) {
  return page.evaluate(async () => {
    // @ts-expect-error Vite serves the browser dependency at runtime.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const root = _roots.get(document.querySelector('canvas'))
    if (!root) return null
    const { scene, camera } = root.store.getState()
    const fans: number[] = []
    scene.traverse((node: { name: string; userData: { rpm?: number } }) => { if (node.name === 'fan') fans.push(node.userData.rpm ?? -1) })
    return {
      cameraMode: camera.userData.mode, cameraPosition: camera.position.toArray(),
      data: !!scene.getObjectByName('data-flow'), power: !!scene.getObjectByName('power-flow'),
      thermal: !!scene.getObjectByName('thermal-airflow'), glass: !!scene.getObjectByName('glass-panel'),
      aioPowered: scene.getObjectByName('aio-display')?.userData.powered,
      aioTemperature: scene.getObjectByName('aio-display')?.userData.temperature,
      fans,
    }
  })
}

test('single boot controller supports power, pause, step navigation and ordered flows', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'poweredOff')
  await expect.poll(async () => (await sceneState(page))?.fans.length, { timeout: 30_000 }).toBe(10)
  expect((await sceneState(page))?.fans.every(rpm => rpm === 0)).toBe(true)
  expect((await sceneState(page))?.aioPowered).toBe(false)
  expect((await sceneState(page))?.data).toBe(false)
  expect((await sceneState(page))?.power).toBe(false)

  await page.getByRole('button', { name: 'POWER ON' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'psuStarting')
  await expect.poll(async () => (await sceneState(page))?.power).toBe(true)
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  const stopped = Number(await page.locator('main').getAttribute('data-phase-progress'))
  await page.waitForTimeout(400)
  expect(Number(await page.locator('main').getAttribute('data-phase-progress'))).toBeCloseTo(stopped, 1)

  const ordered = ['standbyPower', 'motherboardPower', 'cpuInitialization', 'memoryTraining', 'gpuInitialization', 'storageDetection', 'osLoading', 'running']
  for (const expected of ordered) {
    await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
    await expect.poll(() => phase(page)).toBe(expected)
    if (['memoryTraining', 'gpuInitialization', 'storageDetection', 'osLoading'].includes(expected)) expect((await sceneState(page))?.data).toBe(true)
  }
  await page.getByRole('button', { name: 'PREVIOUS STEP', exact: true }).click()
  await expect.poll(() => phase(page)).toBe('osLoading')
  await page.getByRole('button', { name: 'RESTART', exact: true }).click()
  await expect.poll(() => phase(page)).toBe('psuStarting')
  await page.getByRole('button', { name: 'SKIP TO RUNNING' }).click()
  await expect.poll(() => phase(page)).toBe('running')
  await expect(page.getByRole('button', { name: 'HIGH', exact: true })).toBeEnabled()
  expect(errors).toEqual([])
})

test('language selector switches the interface and educational phase copy', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'RU', exact: true }).click()
  await expect(page.getByRole('button', { name: 'ЛАБОРАТОРИЯ', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'ВКЛЮЧИТЬ', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'ВКЛЮЧИТЬ', exact: true }).click()
  await expect(page.getByTestId('phase-card')).toContainText('ЗАПУСК БЛОКА ПИТАНИЯ')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('button', { name: 'LAB', exact: true })).toBeVisible()
  await expect(page.getByTestId('phase-card')).toContainText('PSU STARTUP')
})

test('automatic boot tour advances through every hardware phase', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'GUIDED TOUR' }).click()
  const visited: string[] = []
  const deadline = Date.now() + 40_000
  while (Date.now() < deadline) {
    const current = await phase(page)
    if (!visited.includes(current!)) visited.push(current!)
    if (current === 'running') break
    await page.waitForTimeout(250)
  }
  expect(visited).toEqual(['psuStarting', 'standbyPower', 'motherboardPower', 'cpuInitialization', 'memoryTraining', 'gpuInitialization', 'storageDetection', 'osLoading', 'running'])
  await expect(page.locator('main')).toHaveAttribute('data-camera-tour', 'active')
})

test('running process modes share telemetry, fan RPM, AIO and thermal inputs', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'SKIP TO RUNNING' }).click()
  await page.waitForTimeout(1200)
  const rpm = Number((await page.locator('.io-row').filter({ hasText: 'COOLING' }).locator('b').innerText()).split(' ')[0])
  const cpuTemperature = Number((await page.locator('.metric').first().locator('small').innerText()).split('°')[0])
  const state = await sceneState(page)
  expect(state?.fans).toHaveLength(10)
  expect(state?.fans.every(value => Math.abs(value - rpm) < 1)).toBe(true)
  expect(state?.aioTemperature).toBe(cpuTemperature)

  await page.getByRole('button', { name: 'MEMORY', exact: true }).click()
  expect((await sceneState(page))?.data).toBe(true)
  await page.getByRole('button', { name: 'POWER', exact: true }).click()
  expect((await sceneState(page))?.power).toBe(true)
  await page.getByRole('button', { name: 'COOLING', exact: true }).click()
  const thermal = await sceneState(page)
  expect(thermal?.thermal).toBe(true)
  await page.getByRole('button', { name: 'HIGH', exact: true }).click()
  await page.waitForTimeout(1000)
  const high = await sceneState(page)
  expect(high?.thermal).toBe(true)
  expect(high?.fans.every(value => value >= 0)).toBe(true)
})

test('internal/external, guided interruption, manual handoff and presentation keys work', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'EXTERNAL', exact: true }).click()
  await expect.poll(async () => (await sceneState(page))?.glass).toBe(true)
  await page.getByRole('button', { name: 'INTERNAL', exact: true }).click()
  await expect.poll(async () => (await sceneState(page))?.glass).toBe(false)

  await page.getByRole('button', { name: 'GUIDED TOUR' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-camera-tour', 'active')
  await expect.poll(async () => (await sceneState(page))?.cameraMode).toBe('tourTransition')
  await page.mouse.move(800, 500)
  await page.mouse.down()
  await page.mouse.move(850, 530, { steps: 6 })
  await page.mouse.up()
  await expect(page.locator('main')).toHaveAttribute('data-camera-tour', 'manual')
  await expect.poll(async () => (await sceneState(page))?.cameraMode).toBe('manual')
  await page.waitForTimeout(2500)
  const released = (await sceneState(page))!.cameraPosition
  await page.waitForTimeout(10_000)
  const later = (await sceneState(page))!.cameraPosition
  expect(Math.hypot(...later.map((value: number, index: number) => value - released[index]))).toBeLessThan(.02)

  await page.getByRole('button', { name: 'RESTART', exact: true }).click()
  await page.getByRole('button', { name: 'PRESENTATION MODE' }).click()
  await expect(page.locator('main')).toHaveClass(/presentation-mode/)
  await page.keyboard.press('Space')
  await expect(page.locator('main')).toHaveAttribute('data-playing', 'false')
  await page.keyboard.press('ArrowRight')
  expect(await phase(page)).toBe('standbyPower')
  await page.keyboard.press('ArrowLeft')
  expect(await phase(page)).toBe('psuStarting')
  await page.keyboard.press('Escape')
  await expect(page.locator('main')).not.toHaveClass(/presentation-mode/)
})

test('shutdown fades activity and returns to poweredOff', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'SKIP TO RUNNING' }).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'SHUT DOWN' }).click()
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'shuttingDown')
  expect((await sceneState(page))?.data).toBe(true)
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'poweredOff', { timeout: 8000 })
  await expect.poll(async () => Number((await page.locator('.io-row').filter({ hasText: 'COOLING' }).locator('b').innerText()).split(' ')[0]), { timeout: 15_000 }).toBeLessThan(20)
  const off = await sceneState(page)
  expect(off?.data).toBe(false)
  expect(off?.power).toBe(false)
  expect(off?.aioPowered).toBe(false)
})
