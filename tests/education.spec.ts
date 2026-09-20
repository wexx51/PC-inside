import { test, expect } from '@playwright/test'

test('assignment and reference explain startup, drivers and storage read/write examples', async ({ page }, info) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'ABOUT', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.learning-objectives li')).toHaveCount(11)
  for (const objective of ['Explain BIOS / UEFI', 'Explain POST', 'Explain bootloader and operating system loading', 'Explain drivers']) {
    await expect(page.getByText(objective, { exact: true })).toBeVisible()
  }
  await expect(page.locator('.assignment-goal')).toContainText('hardware, firmware, the operating system, and applications interact')
  await page.locator('.about-card').screenshot({ path: info.outputPath('assignment.png') })
  await page.getByRole('button', { name: 'RU', exact: true }).click()
  await expect(page.locator('.learning-objectives')).toContainText('Объяснить драйверы')
  await expect(page.locator('.learning-objectives')).toContainText('Объяснить загрузчик')
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await page.getByRole('button', { name: 'ARCHITECTURE', exact: true }).click()
  const reference = page.locator('.academic-reference')
  await expect(reference.locator('[data-reference="firmware"]')).toContainText('non-volatile motherboard flash')
  await expect(reference.locator('[data-reference="post"]')).toContainText('Power-On Self-Test')
  await expect(reference.locator('[data-reference="post"]')).toContainText('not a full operating-system diagnostic')
  await expect(reference.locator('[data-reference="boot-device"]')).toContainText('UEFI boot order')
  await expect(reference.locator('[data-reference="bootloader"]')).toContainText('places required files in RAM')
  await expect(reference.locator('[data-reference="operating-system"]')).toContainText('schedules application threads')
  const drivers = reference.locator('[data-reference="drivers"]')
  for (const text of ['device-specific commands', 'graphics', 'storage', 'USB', 'audio', 'networking']) await expect(drivers).toContainText(text)
  await expect(reference.locator('[data-reference="input-devices"]')).toContainText('DRIVER → OPERATING SYSTEM → APPLICATION')
  await expect(reference.locator('[data-reference="output-devices"]')).toContainText('APPLICATION → GRAPHICS SYSTEM → GPU → DISPLAY OUTPUT → MONITOR')
  const rows = reference.locator('.comparison-row').filter({ hasNot: page.locator('b') })
  await expect(rows).toHaveCount(3)
  for (const row of await rows.all()) {
    await expect(row).toContainText('Read:')
    await expect(row).toContainText('Write:')
    await expect(row).toContainText('MB/s')
  }
  await expect(reference.locator('.virtual-pc-storage')).toContainText('1 TB NAND flash')
  await expect(reference.locator('.academic-disclaimer')).toContainText('rather than representing one specific commercial PC')
  await page.locator('.storage-comparison').screenshot({ path: info.outputPath('storage-comparison.png') })
  await reference.locator('[data-reference="post"]').screenshot({ path: info.outputPath('post-reference.png') })
})

test('console completion follows progress, rewinds correctly, and reports shutdown', async ({ page }, info) => {
  await page.goto('/')
  const phase = () => page.locator('main').getAttribute('data-system-phase')
  const status = (label: string) => page.locator('.boot-log > div').filter({ has: page.locator('span', { hasText: new RegExp(`^${label}$`) }) }).locator('b')
  await expect(status('POWER BUTTON')).toHaveText('WAITING')
  await page.getByRole('button', { name: 'POWER ON', exact: true }).click()
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  expect(await phase()).toBe('powerButton')
  await expect(status('POWER BUTTON')).toHaveText('PRESSED')
  const stages = ['psuStarting','resetRelease','uefiStart','post','memoryInitialization','gpuInitialization','storageDetection','bootDeviceSelection','bootloader']
  for (const next of stages) {
    await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
    expect(await phase()).toBe(next)
  }
  for (const label of ['POST CPU','POST MEMORY','POST GRAPHICS / DISPLAY','POST STORAGE','POST ESSENTIAL BOARD HARDWARE']) await expect(status(label)).toHaveText('OK')
  await expect(status('POWER GOOD')).toHaveText('OK')
  await expect(status('BOOT DEVICE')).toHaveText('NVME SSD')
  await expect(status('BOOTLOADER')).toHaveText('LOADING')
  await expect(status('SYSTEM')).toHaveCount(0)
  await page.waitForTimeout(600)
  await expect(status('BOOTLOADER')).toHaveText('LOADING')
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect(status('BOOTLOADER')).toHaveText('LOADED', { timeout: 5000 })
  await expect.poll(phase).toBe('osLoading')
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  await expect(status('OS KERNEL  SSD → RAM → CPU')).toHaveText('LOADING')
  await page.locator('.boot-console').screenshot({ path: info.outputPath('kernel-console.png') })
  await page.getByRole('button', { name: 'PREVIOUS STEP', exact: true }).click()
  await expect(status('BOOTLOADER')).toHaveText('LOADING')
  await expect(status('OS KERNEL  SSD → RAM → CPU')).toHaveCount(0)
  await page.getByRole('button', { name: 'SKIP TO RUNNING', exact: true }).click()
  for (const label of ['GPU / DISPLAY DRIVER','USB / INPUT DRIVER','STORAGE DRIVER','NETWORK DRIVER','AUDIO DRIVER']) await expect(status(label)).toHaveText('INITIALIZED')
  await expect(status('SYSTEM')).toHaveText('READY')
  await page.getByRole('button', { name: 'SHUT DOWN', exact: true }).click()
  await expect(status('SHUTDOWN')).toHaveText('SAVING DATA / POWERING OFF')
  await expect(status('SYSTEM')).toHaveCount(0)
  await expect.poll(phase, { timeout: 8000 }).toBe('poweredOff')
  await expect(status('POWER BUTTON')).toHaveText('WAITING')
})

test('boot packets and PSU highlight survive previous power and cooling lessons', async ({ page }) => {
  await page.goto('/')
  const scene = () => page.evaluate(async () => {
    // @ts-expect-error Vite browser dependency.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    // @ts-expect-error Vite source module.
    const { PSU_MOUNT } = await import('/src/components/layout.ts')
    const { scene } = _roots.get(document.querySelector('canvas')).store.getState()
    const data = scene.getObjectByName('data-flow')
    let packets = 0
    data?.traverse((node: { geometry?: { type: string } }) => { if (node.geometry?.type === 'SphereGeometry') packets++ })
    return { packets, highlight: scene.getObjectByName('stage-highlight')?.position.toArray(), psu: PSU_MOUNT }
  })
  for (const mode of ['POWER', 'COOLING']) {
    await page.getByRole('button', { name: 'SKIP TO RUNNING', exact: true }).click()
    await page.getByRole('button', { name: mode, exact: true }).click()
    await page.getByRole('button', { name: 'RESTART', exact: true }).click()
    await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
    await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
    const powered = await scene()
    expect(powered.highlight).toEqual(powered.psu)
    for (const phase of ['resetRelease','uefiStart','post','memoryInitialization','gpuInitialization','storageDetection','bootDeviceSelection','bootloader','osLoading','driverInitialization']) {
      await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
      await expect(page.locator('main')).toHaveAttribute('data-system-phase', phase)
      if (!['resetRelease','uefiStart'].includes(phase)) expect((await scene()).packets).toBeGreaterThan(0)
    }
  }
})
