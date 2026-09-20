import { useEffect, useState } from 'react'

export const executionStages = [
  ['IDLE', 'Ready to launch', 'Start the computer to run the browser demonstration.', ''],
  ['USER_INPUT', 'User input', 'A mouse click reaches the OS through the USB controller and input driver.', 'Mouse → USB controller → input driver → OS'],
  ['OS_REQUEST', 'Operating system', 'The OS receives the launch request and uses drivers to access hardware.', 'Input event → OS → file system'],
  ['PROCESS_CREATION', 'Process creation', 'The OS creates a process and allocates memory and resources.', 'OS → process / virtual memory'],
  ['STORAGE_READ', 'Storage', 'The executable and required files are read from persistent storage.', 'SSD → storage controller'],
  ['LOAD_TO_RAM', 'Load to RAM', 'Active code and data are loaded into RAM; the original files remain on SSD.', 'SSD → RAM'],
  ['CPU_EXECUTION', 'CPU execution', 'The CPU fetches, decodes and executes instructions, exchanging active code and data with RAM.', 'RAM ↔ CPU · FETCH → DECODE → EXECUTE'],
  ['GPU_RENDER', 'GPU rendering', 'The application submits drawing work through the graphics API and driver.', 'CPU / application → graphics API / driver → GPU'],
  ['DISPLAY_OUTPUT', 'Display output', 'The GPU sends the rendered browser frame through the display connection.', 'GPU → display output → monitor'],
  ['APP_READY', 'Application ready', 'The browser is ready. Load the local example page to demonstrate networking.', 'Browser ready for input'],
  ['NETWORK_REQUEST', 'Network request', 'The browser asks the OS networking stack to load example.com.', 'Browser → OS network stack'],
  ['NETWORK_OUTBOUND', 'Network outbound', 'The network driver and Ethernet / Wi-Fi interface transmit the request.', 'Application → OS network stack → network interface → network'],
  ['NETWORK_RESPONSE', 'Network response', 'The interface receives response data into OS-managed RAM buffers.', 'Network → network interface → OS / RAM → application'],
  ['NETWORK_PROCESSING', 'Page processing', 'The CPU processes received content held in RAM and prepares drawing commands.', 'RAM ↔ CPU / application'],
  ['PAGE_RENDER', 'Page rendering', 'The graphics system renders the processed page, then sends its frame to the monitor.', 'CPU → graphics API / GPU → display output → monitor'],
  ['PAGE_READY', 'Page ready', 'The local demonstration page is displayed. No real network request was made.', 'PC INSIDE NETWORK DEMO'],
] as const
export type ExecutionState = typeof executionStages[number][0]
export type ExecutionSnapshot = { state: ExecutionState; progress: number }
export const idleExecution: ExecutionSnapshot = { state: 'IDLE', progress: 0 }
export const executionDefinition = (state: ExecutionState) => executionStages.find(stage => stage[0] === state)!
export const executionBusy = (state: ExecutionState) => !['IDLE', 'APP_READY', 'PAGE_READY'].includes(state)
export function advanceExecution(current: ExecutionSnapshot, seconds: number): ExecutionSnapshot {
  if (!executionBusy(current.state)) return current
  const duration = current.state === 'CPU_EXECUTION' ? 3.6 : 2.4
  const progress = current.progress + seconds / duration
  if (progress < 1) return { ...current, progress }
  return { state: executionStages[executionStages.findIndex(stage => stage[0] === current.state) + 1][0], progress: 0 }
}
export function useExecutionController(ready: boolean) {
  const [snapshot, setSnapshot] = useState<ExecutionSnapshot>(idleExecution)
  const [held, setHeld] = useState(false)
  useEffect(() => {
    if (!ready) {
      // The boot controller is authoritative: applications cannot survive shutdown.
      // eslint-disable-next-line react/set-state-in-effect
      setSnapshot(idleExecution)
      setHeld(false)
      return
    }
    if (held) return
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const delta = Math.min((now - last) / 1000, .25)
      last = now
      setSnapshot(current => advanceExecution(current, delta))
    }, 50)
    return () => window.clearInterval(timer)
  }, [ready, held])
  return {
    snapshot: ready ? snapshot : idleExecution,
    launch: () => { if (ready) { setHeld(false); setSnapshot({ state: 'USER_INPUT', progress: 0 }) } },
    loadWebsite: () => { if (ready) { setHeld(false); setSnapshot(current => ['APP_READY', 'PAGE_READY'].includes(current.state) ? { state: 'NETWORK_REQUEST', progress: 0 } : current) } },
    show: (state: ExecutionState, progress = 0) => { setHeld(true); setSnapshot({ state, progress }) },
    reset: () => { setHeld(false); setSnapshot(idleExecution) },
  }
}
