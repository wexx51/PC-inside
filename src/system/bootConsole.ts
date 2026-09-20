import { phaseDefinitions, type SystemPhase } from './bootMachine'

type ConsoleLine = { phase: SystemPhase; threshold?: number; label: string; status: string; pending?: string }
const consoleLines: ConsoleLine[] = [
  {phase:'powerButton',label:'POWER BUTTON',status:'PRESSED'},
  {phase:'psuStarting',threshold:0,label:'STANDBY POWER (5VSB)',status:'ACTIVE'},
  {phase:'psuStarting',threshold:.18,label:'PSU STARTUP',status:'OK'},
  {phase:'psuStarting',threshold:.36,label:'DC RAILS 12V / 5V / 3.3V',status:'REGULATED'},
  {phase:'psuStarting',threshold:.56,label:'MOTHERBOARD POWER',status:'ON'},
  {phase:'psuStarting',threshold:.76,label:'POWER GOOD',status:'OK'},
  {phase:'resetRelease',label:'CPU RESET',status:'RELEASED'},
  {phase:'uefiStart',label:'UEFI FIRMWARE (BOARD FLASH)',status:'STARTED'},
  {phase:'post',threshold:0,label:'POST CPU',status:'OK'},
  {phase:'post',threshold:.18,label:'POST MEMORY',status:'OK'},
  {phase:'post',threshold:.36,label:'POST GRAPHICS / DISPLAY',status:'OK'},
  {phase:'post',threshold:.54,label:'POST STORAGE',status:'OK'},
  {phase:'post',threshold:.72,label:'POST ESSENTIAL BOARD HARDWARE',status:'OK'},
  {phase:'memoryInitialization',threshold:.85,pending:'TRAINING',label:'MEMORY TRAINING',status:'COMPLETE'},
  {phase:'gpuInitialization',threshold:.85,pending:'INITIALIZING',label:'GPU / DISPLAY',status:'INITIALIZED'},
  {phase:'storageDetection',threshold:.85,pending:'DETECTING',label:'NVME STORAGE',status:'DETECTED'},
  {phase:'bootDeviceSelection',threshold:.85,pending:'SELECTING',label:'BOOT DEVICE',status:'NVME SSD'},
  {phase:'bootloader',threshold:.85,pending:'LOADING',label:'BOOTLOADER',status:'LOADED'},
  {phase:'osLoading',threshold:.85,pending:'LOADING',label:'OS KERNEL  SSD → RAM → CPU',status:'LOADED'},
  {phase:'driverInitialization',threshold:0,label:'GPU / DISPLAY DRIVER',status:'INITIALIZED'},
  {phase:'driverInitialization',threshold:.16,label:'USB / INPUT DRIVER',status:'INITIALIZED'},
  {phase:'driverInitialization',threshold:.32,label:'STORAGE DRIVER',status:'INITIALIZED'},
  {phase:'driverInitialization',threshold:.48,label:'NETWORK DRIVER',status:'INITIALIZED'},
  {phase:'driverInitialization',threshold:.64,label:'AUDIO DRIVER',status:'INITIALIZED'},
  {phase:'systemInitialization',threshold:.85,pending:'STARTING',label:'SYSTEM SERVICES / OS',status:'STARTED'},
  {phase:'running',label:'SYSTEM',status:'READY'},
]

// Derive the log from the existing controller. No clock or retained history:
// previous/restart/skip actions immediately show the corresponding state.
export function bootConsoleLines(phase: SystemPhase, progress: number, locale: 'en' | 'ru' = 'en') {
  if (phase === 'poweredOff') return [{ phase, label: locale === 'ru' ? 'КНОПКА ПИТАНИЯ' : 'POWER BUTTON', status: locale === 'ru' ? 'ОЖИДАНИЕ' : 'WAITING' }]
  if (phase === 'shuttingDown') return [{ phase, label: locale === 'ru' ? 'ВЫКЛЮЧЕНИЕ' : 'SHUTDOWN', status: locale === 'ru' ? 'ЗАВЕРШЕНИЕ РАБОТЫ' : 'SAVING DATA / POWERING OFF' }]
  const currentIndex = phaseDefinitions.findIndex(item => item.id === phase)
  return consoleLines.flatMap(line => {
    const lineIndex = phaseDefinitions.findIndex(item => item.id === line.phase)
    if (lineIndex < currentIndex || (lineIndex === currentIndex && progress >= (line.threshold ?? 0))) return [line]
    if (lineIndex === currentIndex && line.pending) return [{ ...line, status: line.pending }]
    return []
  })
}
