import { test, expect, type Page } from '@playwright/test'

// Observe actual canvas text, rather than trusting screen metadata alone.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const fillRect = CanvasRenderingContext2D.prototype.fillRect
    const fillText = CanvasRenderingContext2D.prototype.fillText
    CanvasRenderingContext2D.prototype.fillRect = function (x, y, w, h) {
      if (x === 0 && y === 0 && w === this.canvas.width && h === this.canvas.height) this.canvas.dataset.drawnText = ''
      fillRect.call(this, x, y, w, h)
    }
    CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
      this.canvas.dataset.drawnText = `${this.canvas.dataset.drawnText ?? ''}\n${text}`
      if (maxWidth === undefined) fillText.call(this, text, x, y)
      else fillText.call(this, text, x, y, maxWidth)
    }
  })
})

async function monitor(page: Page) {
  return page.evaluate(async () => {
    // @ts-expect-error Runtime Vite module used by the real scene.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    const root = _roots.get(document.querySelector('canvas'))
    if (!root) return null
    const { scene, camera, controls } = root.store.getState()
    const screen = scene.getObjectByName('monitor-screen')
    if (!screen?.material.map) return null
    const canvas = screen.material.map.image as HTMLCanvasElement
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
    let litPixels = 0
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] > 40 || pixels[i + 1] > 40 || pixels[i + 2] > 40) litPixels++
    return { text: canvas.dataset.drawnText, pixels: canvas.toDataURL(), phase: document.querySelector('main')?.getAttribute('data-system-phase'), texture: screen.material.map.uuid, ...screen.userData, litPixels, size: [canvas.width, canvas.height], output: !!scene.getObjectByName('display-output-flow'), cable: !!scene.getObjectByName('display-cable'), mode: camera.userData.mode, focus: camera.userData.focus, position: camera.position.toArray(), enabled: controls.enabled }
  })
}

test('screen follows every boot phase, shutdown and restart using one texture', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect.poll(async () => (await monitor(page))?.state).toBe('OFF')
  expect((await monitor(page))?.litPixels).toBe(0)
  await page.getByRole('button', { name: 'POWER ON', exact: true }).click()
  expect((await monitor(page))?.state).toBe('OFF')
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  const expected = [
    ['psuStarting', 'OFF', ''], ['resetRelease', 'OFF', ''],
    ['uefiStart', 'FIRMWARE', 'PC INSIDE UEFI'], ['post', 'POST', 'CPU ........ OK'],
    ['memoryInitialization', 'POST', 'MEMORY ..... CHECKING'],
    ['gpuInitialization', 'POST', 'MEMORY ..... 32 GB'],
    ['storageDetection', 'POST', 'GPU ........ INITIALIZED'],
    ['bootDeviceSelection', 'POST', 'POST COMPLETE'],
    ['bootloader', 'BOOTLOADER', 'BOOT DEVICE: NVME SSD'],
    ['osLoading', 'OS_LOADING', 'Loading kernel'],
    ['driverInitialization', 'OS_LOADING', 'Preparing devices'],
    ['systemInitialization', 'OS_LOADING', 'Starting user session'],
    ['running', 'DESKTOP', 'SYSTEM READY'],
  ]
  const texture = (await monitor(page))?.texture
  for (const [phase, state, text] of expected) {
    await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
    await expect.poll(async () => (await monitor(page))?.state).toBe(state)
    const actual = await monitor(page)
    expect(actual?.litPixels === 0).toBe(state === 'OFF')
    expect(actual?.output).toBe(state !== 'OFF')
    expect(actual?.texture).toBe(texture)
    expect(actual?.phase).toBe(phase)
    expect(actual?.text).toContain(text)
    if (['uefiStart', 'bootDeviceSelection', 'bootloader', 'osLoading', 'running'].includes(phase)) {
      await info.attach(`${phase}.png`, { body: Buffer.from(actual!.pixels.split(',')[1], 'base64'), contentType: 'image/png' })
    }
  }
  expect((await monitor(page))?.text).toContain('Browser')
  expect((await monitor(page))?.text).toContain('Files')
  expect((await monitor(page))?.text).toContain('Terminal')
  expect((await monitor(page))?.size).toEqual([1280, 720])
  expect((await monitor(page))?.cable).toBe(true)
  const draws = (await monitor(page))?.redraws
  await page.waitForTimeout(1300)
  expect((await monitor(page))?.redraws).toBe(draws)
  await page.getByRole('button', { name: 'SYSTEM / DESK', exact: true }).click()
  await expect.poll(async () => { const s = await monitor(page); return `${s?.focus}:${s?.mode}` }, { timeout: 20000 }).toBe('desk:manual')
  await page.screenshot({ path: info.outputPath('desk-desktop.png') })
  for (const mode of ['APPLICATION', 'NETWORK']) {
    await page.getByRole('button', { name: mode, exact: true }).click()
    await page.waitForTimeout(2600)
    const screen = await monitor(page)
    expect(screen?.state).toBe('DESKTOP')
    expect(screen?.texture).toBe(texture)
    expect(screen?.redraws).toBe(draws)
  }
  await page.getByRole('button', { name: 'DATA FLOW', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.output).toBe(false)
  await page.getByRole('button', { name: 'SHUT DOWN', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.state).toBe('OFF')
  expect((await monitor(page))?.litPixels).toBe(0)
  expect((await monitor(page))?.texture).toBe(texture)
  await page.getByRole('button', { name: 'SKIP TO RUNNING', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.state).toBe('DESKTOP')
  expect((await monitor(page))?.texture).toBe(texture)
  await page.getByRole('button', { name: 'SHUT DOWN', exact: true }).click()
  await expect(page.locator('main')).toHaveAttribute('data-system-phase', 'poweredOff', { timeout: 8000 })
  await page.getByRole('button', { name: 'POWER ON', exact: true }).click()
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  expect((await monitor(page))?.state).toBe('OFF')
  expect((await monitor(page))?.texture).toBe(texture)
  expect(errors).toEqual([])
})

test('monitor explorer and desk camera release manual orbit', async ({ page }, info) => {
  await page.goto('/')
  await page.locator('.component').filter({ has: page.locator('b', { hasText: /^MONITOR$/ }) }).click()
  await expect(page.locator('.info-panel')).toContainText('Displays visual information produced by the computer.')
  await expect.poll(async () => { const s = await monitor(page); return `${s?.focus}:${s?.mode}` }, { timeout: 20000 }).toBe('monitor:manual')
  await page.getByRole('button', { name: 'SKIP TO RUNNING', exact: true }).click()
  await page.screenshot({ path: info.outputPath('monitor-desktop.png') })
  await page.getByRole('button', { name: 'SYSTEM / DESK', exact: true }).click()
  await expect.poll(async () => { const s = await monitor(page); return `${s?.focus}:${s?.mode}` }, { timeout: 20000 }).toBe('desk:manual')
  const before = (await monitor(page))!.position
  await page.mouse.move(780, 390); await page.mouse.down()
  await page.mouse.move(910, 450, { steps: 20 }); await page.mouse.up()
  await page.waitForTimeout(2500)
  const moved = await monitor(page)
  expect(moved!.position).not.toEqual(before)
  expect(moved!.enabled).toBe(true)
  await page.waitForTimeout(3500)
  const later = (await monitor(page))!.position
  expect(Math.hypot(...later.map((v: number, i: number) => v - moved!.position[i]))).toBeLessThan(.01)
})


test('OS loading animation pauses, rewinds and resumes with the shared controller', async ({ page }, info) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO RUNNING', exact: true }).click()
  await page.getByRole('button', { name: 'PREVIOUS STEP', exact: true }).click()
  await page.getByRole('button', { name: 'PREVIOUS STEP', exact: true }).click()
  await page.getByRole('button', { name: 'PREVIOUS STEP', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.text).toContain('Loading kernel')
  const start = (await monitor(page))!
  expect(start.loading).toBe(0)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.loading).toBeGreaterThan(.04)
  await page.getByRole('button', { name: 'PAUSE', exact: true }).click()
  const paused = (await monitor(page))!
  expect(paused.pixels).not.toBe(start.pixels)
  expect(paused.texture).toBe(start.texture)
  const source = Number(await page.locator('main').getAttribute('data-phase-progress')) / 3
  expect(Math.abs(paused.loading - source)).toBeLessThan(.025)
  await page.waitForTimeout(800)
  expect((await monitor(page))?.redraws).toBe(paused.redraws)
  expect((await monitor(page))?.pixels).toBe(paused.pixels)
  await info.attach('os-loading.png', { body: Buffer.from(paused.pixels.split(',')[1], 'base64'), contentType: 'image/png' })
  await page.getByRole('button', { name: 'PREVIOUS STEP', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.state).toBe('BOOTLOADER')
  await page.getByRole('button', { name: 'NEXT STEP', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.loading).toBe(0)
  await page.getByRole('button', { name: 'PLAY', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.text, { timeout: 7000 }).toContain('Preparing devices')
  expect((await monitor(page))?.loading).toBeGreaterThanOrEqual(.32)
  await expect.poll(async () => (await monitor(page))?.text, { timeout: 6000 }).toContain('Starting user session')
  expect((await monitor(page))?.loading).toBeGreaterThanOrEqual(.66)
  await expect.poll(async () => (await monitor(page))?.state, { timeout: 6000 }).toBe('DESKTOP')
  expect((await monitor(page))?.texture).toBe(start.texture)
  await page.getByRole('button', { name: 'RESTART', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.state).toBe('OFF')
  expect((await monitor(page))?.litPixels).toBe(0)
})

test('display cable meets both plugs, clears hardware and carries output toward the monitor', async ({ page }, info) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'SKIP TO RUNNING', exact: true }).click()
  await expect.poll(async () => (await monitor(page))?.state).toBe('DESKTOP')
  const cableState = () => page.evaluate(async () => {
    // @ts-expect-error Vite serves the dependency in the browser.
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js')
    // @ts-expect-error Vite serves the dependency in the browser.
    const THREE = await import('/node_modules/.vite/deps/three.js')
    const { scene, camera } = _roots.get(document.querySelector('canvas')).store.getState()
    scene.updateMatrixWorld(true)
    const cable = scene.getObjectByName('display-cable')
    const path = cable.geometry.parameters.path
    const radius = cable.geometry.parameters.radius
    const world = (t: number) => cable.localToWorld(path.getPointAt(t))
    const gpuRelief = scene.getObjectByName('gpu-strain-relief')
    const monitorRelief = scene.getObjectByName('monitor-strain-relief')
    const startGap = world(0).distanceTo(gpuRelief.localToWorld(new THREE.Vector3(0, gpuRelief.geometry.parameters.height / 2, 0)))
    const endGap = world(1).distanceTo(monitorRelief.localToWorld(new THREE.Vector3(0, -monitorRelief.geometry.parameters.height / 2, 0)))
    const obstacles = ['monitor-housing', 'monitor-bezel', 'monitor-stand', 'monitor-base'].map(name => {
      const mesh = scene.getObjectByName(name)
      mesh.geometry.computeBoundingBox()
      return { mesh, bounds: mesh.geometry.boundingBox.clone().expandByScalar(radius * 1.1) }
    })
    let intersections = 0, lowest = Infinity, rightmost = -Infinity
    const pulse = scene.getObjectByName('display-output-flow')
    let nearest = Infinity, pulseIndex = 0
    for (let i = 0; i <= 1000; i++) {
      const p = path.getPointAt(i / 1000)
      lowest = Math.min(lowest, p.y - radius)
      rightmost = Math.max(rightmost, p.x + radius)
      const distance = pulse ? p.distanceTo(pulse.position) : Infinity
      if (distance < nearest) { nearest = distance; pulseIndex = i }
      const w = cable.localToWorld(p)
      if (obstacles.some(({ mesh, bounds }) => bounds.containsPoint(mesh.worldToLocal(w.clone())))) intersections++
    }
    const ray = new THREE.Raycaster()
    const gpu = scene.getObjectByName('gpu-assembly')
    const direction = gpu.getWorldPosition(new THREE.Vector3()).sub(camera.position)
    ray.set(camera.position, direction.clone().normalize())
    ray.far = direction.length()
    const monitorBlocksInterior = ray.intersectObject(scene.getObjectByName('component-monitor'), true).length > 0
    return { startGap, endGap, intersections, lowest, rightmost, nearest, pulseIndex,
      triangles: cable.geometry.index.count / 3, geometry: cable.geometry.uuid,
      output: !!pulse, monitorBlocksInterior }
  })
  const first = await cableState()
  expect(first.startGap).toBeLessThan(.001)
  expect(first.endGap).toBeLessThan(.001)
  expect(first.intersections).toBe(0)
  expect(first.lowest).toBeGreaterThan(-3.08)
  expect(first.rightmost).toBeLessThan(-4.3)
  expect(first.triangles).toBeLessThan(1000)
  expect(first.nearest).toBeLessThan(.02)
  await page.waitForTimeout(350)
  const next = await cableState()
  expect((next.pulseIndex - first.pulseIndex + 1000) % 1000).toBeGreaterThan(0)
  expect(next.nearest).toBeLessThan(.02)
  expect(next.geometry).toBe(first.geometry)
  await page.getByRole('button', { name: 'DATA FLOW', exact: true }).click()
  expect((await cableState()).output).toBe(false)
  expect((await cableState()).geometry).toBe(first.geometry)
  await page.getByRole('button', { name: 'DATA FLOW', exact: true }).click()
  await page.locator('.component').filter({ has: page.locator('b', { hasText: /^MONITOR$/ }) }).click()
  await expect(page.locator('.info-panel')).toContainText('Type: Output Device')
  await expect(page.locator('.info-panel')).toContainText('Application → CPU / graphics API → GPU → display output → monitor')
  await page.getByRole('button', { name: 'SYSTEM / DESK', exact: true }).click()
  await expect.poll(async () => { const s = await monitor(page); return `${s?.focus}:${s?.mode}` }, { timeout: 20000 }).toBe('desk:manual')
  expect((await cableState()).monitorBlocksInterior).toBe(false)
  await page.getByRole('button', { name: 'Close explanation', exact: true }).click()
  await page.screenshot({ path: info.outputPath('physical-output-path.png') })
})
