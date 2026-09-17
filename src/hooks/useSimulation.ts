import { useEffect, useState } from 'react'
import type { SystemPhase } from '../system/bootMachine'

export type LoadMode = 'IDLE' | 'NORMAL LOAD' | 'HIGH LOAD'
export type Simulation = { cpuLoad: number; gpuLoad: number; cpuTemp: number; gpuTemp: number; memory: number; fanRpm: number }
export const workloads: Record<LoadMode, [number, number, number]> = { IDLE: [8, 5, 42], 'NORMAL LOAD': [42, 56, 61], 'HIGH LOAD': [91, 96, 82] }
export const initialSimulation: Simulation = { cpuLoad: 42, gpuLoad: 56, cpuTemp: 55, gpuTemp: 59, memory: 61, fanRpm: 1150 }
export const poweredOffSimulation: Simulation = { cpuLoad: 0, gpuLoad: 0, cpuTemp: 29, gpuTemp: 28, memory: 0, fanRpm: 0 }
const approach = (value: number, target: number, seconds: number, dt: number) => value + (target - value) * (1 - Math.exp(-dt / seconds))

export function stepSimulation(previous: Simulation, mode: LoadMode, dt: number): Simulation {
  const target = workloads[mode]
  const cpuLoad = approach(previous.cpuLoad, target[0], 1.6, dt)
  const gpuLoad = approach(previous.gpuLoad, target[1], 1.6, dt)
  const cooling = Math.max(0, previous.fanRpm - 700) / 1100
  const cpuTemp = approach(previous.cpuTemp, 33 + cpuLoad * .61 - cooling * 6, 5, dt)
  const gpuTemp = approach(previous.gpuTemp, 31 + gpuLoad * .57 - cooling * 6, 6, dt)
  const heat = Math.max(cpuTemp, gpuTemp)
  const targetRpm = Math.min(1900, Math.max(700, 700 + (heat - 38) * 27))
  return { cpuLoad, gpuLoad, cpuTemp, gpuTemp, memory: approach(previous.memory, target[2], 2, dt), fanRpm: approach(previous.fanRpm, targetRpm, targetRpm > previous.fanRpm ? 2.5 : 4, dt) }
}

const phaseTargets: Partial<Record<SystemPhase, [number, number, number, number]>> = {
  poweredOff: [0, 0, 0, 0], psuStarting: [0, 0, 0, 0], standbyPower: [1, 0, 0, 0], motherboardPower: [3, 0, 1, 0],
  cpuInitialization: [24, 0, 4, 620], memoryTraining: [31, 0, 18, 760], gpuInitialization: [28, 32, 20, 920],
  storageDetection: [22, 8, 14, 840], osLoading: [58, 22, 46, 1080], shuttingDown: [0, 0, 0, 0],
}

export function stepSystemSimulation(previous: Simulation, mode: LoadMode, phase: SystemPhase, dt: number): Simulation {
  if (phase === 'running') return stepSimulation(previous, mode, dt)
  const [cpuTarget, gpuTarget, memoryTarget, rpmTarget] = phaseTargets[phase] ?? [0, 0, 0, 0]
  const off = phase === 'poweredOff' || phase === 'psuStarting' || phase === 'standbyPower'
  const cpuLoad = approach(previous.cpuLoad, cpuTarget, off ? 1.2 : 1.6, dt)
  const gpuLoad = approach(previous.gpuLoad, gpuTarget, off ? 1.2 : 1.6, dt)
  const cpuTemp = approach(previous.cpuTemp, off ? 28 : 31 + cpuLoad * .35, phase === 'shuttingDown' ? 4.5 : 5, dt)
  const gpuTemp = approach(previous.gpuTemp, off ? 27 : 30 + gpuLoad * .32, phase === 'shuttingDown' ? 5 : 6, dt)
  return {
    cpuLoad, gpuLoad, cpuTemp, gpuTemp,
    memory: approach(previous.memory, memoryTarget, 1.8, dt),
    fanRpm: approach(previous.fanRpm, rpmTarget, rpmTarget > previous.fanRpm ? 2.1 : 3.6, dt),
  }
}

export function useSimulation(loadMode: LoadMode, phase: SystemPhase = 'running') {
  const [simulation, setSimulation] = useState(phase === 'poweredOff' ? poweredOffSimulation : initialSimulation)
  useEffect(() => {
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now(), dt = Math.min(1, (now - previous) / 1000)
      previous = now
      setSimulation(state => stepSystemSimulation(state, loadMode, phase, dt))
    }, 100)
    return () => window.clearInterval(timer)
  }, [loadMode, phase])
  // Rounding happens only at the presentation boundary, never in the integrator.
  return { simulation, metrics: [simulation.cpuLoad, simulation.gpuLoad, simulation.cpuTemp, simulation.gpuTemp, simulation.memory].map(Math.round), fanRpm: simulation.fanRpm }
}
