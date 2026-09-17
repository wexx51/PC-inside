import { test, expect } from '@playwright/test'

test('camera routes avoid the chassis from every exterior direction', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const failures = await page.evaluate(async () => {
    // @ts-expect-error Modules are transformed by the running Vite server.
    const { safeCameraPath, focusCandidates, segmentCrossesBox } = await import('/src/components/cameraPlan.ts')
    // @ts-expect-error Modules are transformed by the running Vite server.
    const { localToWorld, worldToLocal, WORLD_UP } = await import('/src/components/layout.ts')
    const problems: string[] = []
    for (const id of ['cpu', 'gpu', 'ram', 'ssd', 'motherboard', 'psu', 'cooling', 'hero']) {
      const destination = focusCandidates(id)[0].position
      for (let degrees = 0; degrees < 360; degrees += 10) for (const y of [-1, 3, 8]) {
        const a = degrees * Math.PI / 180
        const from = localToWorld(WORLD_UP.clone().set(Math.sin(a) * 13, y, Math.cos(a) * 13))
        const route = safeCameraPath(from, destination)
        for (let i = 1; i < route.length; i++) if (segmentCrossesBox(worldToLocal(route[i - 1]), worldToLocal(route[i]))) problems.push(`${id}: ${degrees}, ${y}, leg ${i}`)
      }
    }
    return problems
  })
  expect(failures).toEqual([])
})

test('thermal integration converges smoothly without integer stalls', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const result = await page.evaluate(async () => {
    // @ts-expect-error Modules are transformed by the running Vite server.
    const { stepSimulation, initialSimulation } = await import('/src/hooks/useSimulation.ts')
    let state = initialSimulation
    const rows = []
    let largestStep = 0
    for (const mode of ['IDLE', 'NORMAL LOAD', 'HIGH LOAD', 'IDLE']) {
      const start = state.fanRpm
      for (let i = 0; i < 600; i++) {
        const next = stepSimulation(state, mode, .1)
        largestStep = Math.max(largestStep, Math.abs(next.fanRpm - state.fanRpm))
        state = next
      }
      rows.push({ mode, start, ...state })
    }
    return { rows, largestStep }
  })
  expect(result.largestStep).toBeLessThan(15)
  expect(result.rows[0].cpuLoad).toBeCloseTo(8)
  expect(result.rows[0].fanRpm).toBeCloseTo(700, 0)
  expect(result.rows[1].fanRpm).toBeGreaterThan(900)
  expect(result.rows[1].fanRpm).toBeLessThan(1300)
  expect(result.rows[2].fanRpm).toBeGreaterThan(1500)
  expect(result.rows[2].fanRpm).toBeLessThan(1900)
  expect(result.rows[3].fanRpm).toBeLessThan(710)
})
