import type { SystemPhase } from './bootMachine'

export type ScreenState = 'OFF' | 'FIRMWARE' | 'POST' | 'BOOTLOADER' | 'OS_LOADING' | 'DESKTOP'

// A projection, not another timeline: all advancement belongs to bootMachine.
const screens: Record<SystemPhase, ScreenState> = {
  poweredOff: 'OFF', powerButton: 'OFF', psuStarting: 'OFF', resetRelease: 'OFF',
  uefiStart: 'FIRMWARE', post: 'POST', memoryInitialization: 'POST',
  gpuInitialization: 'POST', storageDetection: 'POST', bootDeviceSelection: 'POST',
  bootloader: 'BOOTLOADER', osLoading: 'OS_LOADING', driverInitialization: 'OS_LOADING',
  systemInitialization: 'OS_LOADING', running: 'DESKTOP', shuttingDown: 'OFF',
}

export function monitorState(phase: SystemPhase): ScreenState {
  return screens[phase]
}

export function monitorView(phase: SystemPhase, progress: number) {
  const state = monitorState(phase)
  let detail = ''
  let loading = 0
  if (state === 'POST') {
    const memoryReady = !['post', 'memoryInitialization'].includes(phase)
    const gpuReady = ['storageDetection', 'bootDeviceSelection'].includes(phase)
    const storageReady = phase === 'bootDeviceSelection'
    detail = [
      'CPU ........ OK',
      `MEMORY ..... ${memoryReady ? '32 GB' : 'CHECKING'}`,
      `GPU ........ ${gpuReady ? 'INITIALIZED' : 'INITIALIZING'}`,
      `NVME SSD ... ${storageReady ? 'DETECTED' : 'SCANNING'}`,
      storageReady ? 'POST COMPLETE' : 'HARDWARE CHECKS IN PROGRESS',
    ].join('\n')
  } else if (state === 'OS_LOADING') {
    const stage = phase === 'osLoading' ? 0 : phase === 'driverInitialization' ? 1 : 2
    detail = ['Loading kernel', 'Preparing devices', 'Starting user session'][stage]
    // One progress bar spans the existing three OS phases. Quantize uploads to 2%.
    const fraction = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
    loading = Math.floor(((stage + fraction) / 3) * 50) / 50
  }
  return { state, detail, loading }
}
