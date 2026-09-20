import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentId } from '../data/components'

export type SystemPhase =
  | 'poweredOff'
  | 'powerButton'
  | 'psuStarting'
  | 'resetRelease'
  | 'uefiStart'
  | 'post'
  | 'memoryInitialization'
  | 'gpuInitialization'
  | 'storageDetection'
  | 'bootDeviceSelection'
  | 'bootloader'
  | 'osLoading'
  | 'driverInitialization'
  | 'systemInitialization'
  | 'running'
  | 'shuttingDown'

export type FlowKind = 'none' | 'power' | 'data' | 'mixed' | 'cooling'

export type PhaseDefinition = {
  id: SystemPhase
  number: string
  title: string
  description: string
  purpose: string
  duration: number
  components: string[]
  componentIds: ComponentId[]
  route: string
  flow: FlowKind
  cameraCue?: ComponentId | 'hero'
}

export const phaseDefinitions: readonly PhaseDefinition[] = [
  { id: 'poweredOff', number: '00', title: 'SYSTEM OFF', description: 'Основные линии отключены; дежурная линия 5VSB позволяет плате ждать нажатия кнопки.', purpose: 'Безопасное состояние ожидания с минимальным дежурным питанием.', duration: 0, components: ['PSU', '5VSB', 'POWER CONTROLLER'], componentIds:['psu','motherboard'], route: 'AC ··· PSU → 5VSB → MOTHERBOARD', flow: 'none', cameraCue: 'hero' },
  { id: 'powerButton', number: '01', title: 'POWER BUTTON', description: 'Кнопка замыкает сигнальную цепь. Контроллер материнской платы, питаемый от 5VSB, просит PSU запуститься.', purpose: 'Превратить действие пользователя в сигнал PS_ON# для блока питания.', duration: 1800, components: ['POWER BUTTON', '5VSB', 'POWER CONTROLLER'], componentIds:['case','motherboard','psu'], route: 'BUTTON → MOTHERBOARD → PS_ON# → PSU', flow: 'power', cameraCue: 'case' },
  { id: 'psuStarting', number: '02', title: 'PSU STARTUP', description: 'PSU получает AC; дежурное 5VSB уже активно. Он стабилизирует линии 12/5/3,3 В, питает плату и затем подаёт Power Good.', purpose: 'Подать на компоненты стабильные линии DC и сообщить, что питание в допуске.', duration: 3600, components: ['AC INPUT', 'PSU', 'DC RAILS', 'POWER GOOD'], componentIds:['psu','motherboard','cpu','gpu','ssd'], route: 'AC → PSU → 12V / 5V / 3.3V → MOTHERBOARD', flow: 'power', cameraCue: 'psu' },
  { id: 'resetRelease', number: '03', title: 'CPU RESET RELEASE', description: 'После Power Good логика платы снимает сброс. CPU начинает выполнение с архитектурно заданного вектора сброса.', purpose: 'Не дать процессору выполнять код, пока питание и тактовые сигналы не стабильны.', duration: 2400, components: ['POWER GOOD', 'RESET LOGIC', 'CPU'], componentIds:['motherboard','cpu'], route: 'POWER GOOD → RESET RELEASE → CPU', flow: 'mixed', cameraCue: 'cpu' },
  { id: 'uefiStart', number: '04', title: 'BIOS / UEFI START', description: 'UEFI — это прошивка в энергонезависимой flash-памяти на материнской плате. CPU начинает её код ранней инициализации.', purpose: 'Подготовить платформу и найти способ запустить загрузочное ПО.', duration: 2800, components: ['UEFI FLASH', 'CPU', 'MOTHERBOARD'], componentIds:['motherboard','cpu'], route: 'UEFI FLASH → CPU → EARLY HARDWARE INIT', flow: 'data', cameraCue: 'motherboard' },
  { id: 'post', number: '05', title: 'POWER-ON SELF-TEST', description: 'UEFI выполняет POST: базово проверяет CPU, RAM, графику, накопитель и важные узлы платы. Это не полная диагностика ОС.', purpose: 'Подтвердить, что критичное для загрузки оборудование может инициализироваться.', duration: 3400, components: ['UEFI', 'POST', 'HARDWARE STATUS'], componentIds:['cpu','ram','gpu','ssd','motherboard'], route: 'UEFI ↔ CPU · RAM · GPU · STORAGE', flow: 'mixed', cameraCue: 'motherboard' },
  { id: 'memoryInitialization', number: '06', title: 'MEMORY INITIALIZATION', description: 'UEFI через встроенный в CPU контроллер определяет модули RAM и выполняет training частот, таймингов и сигналов.', purpose: 'Сделать RAM — быструю временную память для активного кода и данных — доступной для загрузки ОС.', duration: 3600, components: ['UEFI', 'CPU / MEMORY CONTROLLER', 'DDR5 RAM'], componentIds:['cpu','ram','motherboard'], route: 'UEFI → CPU / MEMORY CONTROLLER ↔ RAM', flow: 'data', cameraCue: 'ram' },
  { id: 'gpuInitialization', number: '07', title: 'GPU INITIALIZATION', description: 'Видеокарта инициализирует графический процессор и видеопамять.', purpose: 'Подготовить графический вывод и PCIe-обмен.', duration: 3200, components: ['CPU', 'PCIe', 'GPU', 'VRAM'], componentIds:['cpu','motherboard','gpu'], route: 'CPU ↔ MOTHERBOARD ↔ GPU', flow: 'mixed', cameraCue: 'gpu' },
  { id: 'storageDetection', number: '08', title: 'STORAGE DETECTION', description: 'UEFI обнаруживает контроллер NVMe и доступные разделы накопителя.', purpose: 'Сделать постоянное хранилище доступным для менеджера загрузки.', duration: 3000, components: ['UEFI', 'NVMe SSD', 'CHIPSET'], componentIds:['motherboard','ssd'], route: 'CPU / CHIPSET ↔ NVMe SSD', flow: 'data', cameraCue: 'ssd' },
  { id: 'bootDeviceSelection', number: '09', title: 'BOOT DEVICE SELECTION', description: 'Менеджер загрузки UEFI проверяет порядок загрузки и выбирает запись на системном разделе EFI.', purpose: 'Выбрать доверенный загрузочный файл и операционную систему.', duration: 3200, components: ['UEFI BOOT MANAGER', 'BOOT ORDER', 'EFI PARTITION'], componentIds:['motherboard','ssd'], route: 'UEFI NVRAM → BOOT ENTRY → EFI PARTITION', flow: 'data', cameraCue: 'ssd' },
  { id: 'bootloader', number: '10', title: 'BOOTLOADER', description: 'UEFI передаёт управление загрузочному ПО на выбранном SSD. Загрузчик помещает ядро и начальный образ в RAM.', purpose: 'Подготовить ядро и передать ему управление с параметрами запуска.', duration: 3600, components: ['BOOTLOADER', 'OS KERNEL', 'INITIAL RAM IMAGE'], componentIds:['ssd','ram','cpu'], route: 'UEFI → SSD BOOTLOADER → RAM → CPU', flow: 'data', cameraCue: 'ram' },
  { id: 'osLoading', number: '11', title: 'OS KERNEL LOADING', description: 'Код ядра и нужные данные читаются из постоянного хранилища SSD во временную RAM. CPU исполняет эти инструкции.', purpose: 'RAM даёт CPU быстрый рабочий набор кода и данных; SSD сохраняет их без питания.', duration: 4400, components: ['NVMe SSD', 'RAM', 'CPU', 'OS KERNEL'], componentIds:['ssd','ram','cpu','motherboard'], route: 'SSD → RAM → CPU EXECUTES KERNEL', flow: 'data', cameraCue: 'cpu' },
  { id: 'driverInitialization', number: '12', title: 'DRIVERS & I/O', description: 'Операционная система загружает драйверы графики, накопителя, USB, аудио и сети.', purpose: 'Предоставить ОС безопасный стандартный доступ к конкретным устройствам.', duration: 3800, components: ['OS', 'DEVICE DRIVERS', 'I/O', 'NETWORK'], componentIds:['motherboard','gpu','ssd'], route: 'OS → DRIVER → DEVICE ↔ INTERRUPTS / DMA', flow: 'data', cameraCue: 'motherboard' },
  { id: 'systemInitialization', number: '13', title: 'SYSTEM SERVICES / OS INITIALIZATION', description: 'Ядро запускает системные службы, сеанс пользователя, сетевой стек и графическую среду.', purpose: 'Перейти от работающего ядра к полноценной системе для пользователя.', duration: 3400, components: ['KERNEL', 'SYSTEM SERVICES', 'USER SESSION'], componentIds:['cpu','ram','ssd','motherboard'], route: 'KERNEL → SERVICES → USER SESSION', flow: 'data', cameraCue: 'motherboard' },
  { id: 'running', number: '14', title: 'SYSTEM READY', description: 'ОС, драйверы и необходимые службы запущены. Система готова к входу и запуску приложений.', purpose: 'Выполнять задачи пользователя, управляя процессами, устройствами, питанием и охлаждением.', duration: 0, components: ['APPLICATIONS', 'OS', 'DRIVERS', 'HARDWARE'], componentIds:['cpu','ram','gpu','ssd','motherboard','cooling'], route: 'INPUT → APP ↔ OS / DRIVERS ↔ HARDWARE → OUTPUT', flow: 'data', cameraCue: 'hero' },
  { id: 'shuttingDown', number: '15', title: 'SAFE SHUTDOWN', description: 'Система завершает запись, останавливает обработку и плавно отключает основные линии.', purpose: 'Сохранить данные и вернуть компьютер в безопасное состояние ожидания.', duration: 5200, components: ['OS', 'STORAGE', 'CPU', 'PSU', 'COOLING'], componentIds:['ram','ssd','cpu','psu','cooling'], route: 'RAM → SSD · COMPONENTS → OFF · 5VSB', flow: 'mixed', cameraCue: 'hero' },
] as const

export const phaseById = Object.fromEntries(phaseDefinitions.map(phase => [phase.id, phase])) as Record<SystemPhase, PhaseDefinition>
export const bootPhases = phaseDefinitions.slice(1, -1)

type Timeline = { phase: SystemPhase; progress: number; playing: boolean }

export function useBootController() {
  const [timeline, setTimeline] = useState<Timeline>({ phase: 'poweredOff', progress: 0, playing: false })
  const index = useMemo(() => phaseDefinitions.findIndex(item => item.id === timeline.phase), [timeline.phase])

  useEffect(() => {
    const definition = phaseById[timeline.phase]
    if (!timeline.playing || definition.duration <= 0) return
    let previous = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const delta = now - previous
      previous = now
      setTimeline(current => {
        if (!current.playing) return current
        const currentDefinition = phaseById[current.phase]
        const progress = current.progress + delta / currentDefinition.duration
        if (progress < 1) return { ...current, progress: Math.min(progress, .999) }
        if (current.phase === 'shuttingDown') return { phase: 'poweredOff', progress: 0, playing: false }
        const currentIndex = phaseDefinitions.findIndex(item => item.id === current.phase)
        const next = phaseDefinitions[Math.min(currentIndex + 1, phaseDefinitions.length - 2)]
        return { phase: next.id, progress: 0, playing: next.id !== 'running' }
      })
    }, 50)
    return () => window.clearInterval(timer)
  }, [timeline.phase, timeline.playing])

  const powerOn = useCallback(() => setTimeline({ phase: 'powerButton', progress: 0, playing: true }), [])
  const shutdown = useCallback(() => setTimeline({ phase: 'shuttingDown', progress: 0, playing: true }), [])
  const togglePlay = useCallback(() => setTimeline(current => {
    if (current.phase === 'poweredOff') return { phase: 'powerButton', progress: 0, playing: true }
    if (current.phase === 'running') return current
    return { ...current, playing: !current.playing }
  }), [])
  const next = useCallback(() => setTimeline(current => {
    if (current.phase === 'shuttingDown') return current
    const currentIndex = phaseDefinitions.findIndex(item => item.id === current.phase)
    const target = phaseDefinitions[Math.min(phaseDefinitions.length - 2, Math.max(1, currentIndex + 1))]
    return { phase: target.id, progress: 0, playing: false }
  }), [])
  const previous = useCallback(() => setTimeline(current => {
    if (current.phase === 'shuttingDown') return current
    const currentIndex = phaseDefinitions.findIndex(item => item.id === current.phase)
    const target = phaseDefinitions[Math.max(1, Math.min(phaseDefinitions.length - 2, currentIndex - 1))]
    return { phase: target.id, progress: 0, playing: false }
  }), [])
  const restart = useCallback(() => setTimeline({ phase: 'powerButton', progress: 0, playing: true }), [])
  const repeat = useCallback(() => setTimeline(current => ({ ...current, progress: 0, playing: current.phase !== 'poweredOff' && current.phase !== 'running' })), [])
  const skipToRunning = useCallback(() => setTimeline({ phase: 'running', progress: 1, playing: false }), [])
  const pause = useCallback(() => setTimeline(current => ({ ...current, playing: false })), [])
  const goTo = useCallback((phase: SystemPhase, progress = 0) => setTimeline({ phase, progress, playing: false }), [])

  return { ...timeline, index, definition: phaseById[timeline.phase], powerOn, shutdown, togglePlay, next, previous, restart, repeat, skipToRunning, pause, goTo }
}
