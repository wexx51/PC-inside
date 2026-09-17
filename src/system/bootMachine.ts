import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentId } from '../data/components'

export type SystemPhase =
  | 'poweredOff'
  | 'psuStarting'
  | 'standbyPower'
  | 'motherboardPower'
  | 'cpuInitialization'
  | 'memoryTraining'
  | 'gpuInitialization'
  | 'storageDetection'
  | 'osLoading'
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
  route: string
  flow: FlowKind
  cameraCue?: ComponentId | 'hero'
}

export const phaseDefinitions: readonly PhaseDefinition[] = [
  { id: 'poweredOff', number: '00', title: 'SYSTEM OFF', description: 'Основные линии питания отключены. Материнская плата ожидает сигнал кнопки.', purpose: 'Безопасное состояние ожидания с минимальным дежурным питанием.', duration: 0, components: ['PSU', '5VSB', 'POWER CONTROLLER'], route: 'PSU ··· 5VSB ··· MOTHERBOARD', flow: 'none', cameraCue: 'hero' },
  { id: 'psuStarting', number: '01', title: 'PSU STARTUP', description: 'Блок питания преобразует переменное напряжение сети в стабильные линии постоянного напряжения.', purpose: 'Подготовить безопасные и стабильные напряжения для компонентов.', duration: 3000, components: ['AC INPUT', 'PSU', 'DC RAILS'], route: 'AC → PSU → 12V / 5V / 3.3V', flow: 'power', cameraCue: 'psu' },
  { id: 'standbyPower', number: '02', title: 'STANDBY POWER', description: 'Дежурное питание позволяет материнской плате обработать сигнал кнопки включения.', purpose: 'Запитать контроллер, который запускает основные линии PSU.', duration: 2800, components: ['PSU', '5VSB', 'MOTHERBOARD'], route: 'PSU → 5VSB → POWER CONTROLLER', flow: 'power', cameraCue: 'motherboard' },
  { id: 'motherboardPower', number: '03', title: 'MAIN POWER RAILS', description: 'Основные линии распределяются по 24-pin ATX, EPS и PCIe кабелям.', purpose: 'Подать подходящее напряжение на плату, CPU, GPU и накопители.', duration: 3400, components: ['24-PIN ATX', 'EPS 8-PIN', 'PCIe POWER'], route: 'PSU → MOTHERBOARD · CPU VRM · GPU', flow: 'power', cameraCue: 'motherboard' },
  { id: 'cpuInitialization', number: '04', title: 'CPU INITIALIZATION', description: 'Процессор начинает выполнение прошивки UEFI и запускает первичную проверку оборудования.', purpose: 'Передать управление от схемы запуска программному коду прошивки.', duration: 3200, components: ['CPU', 'VRM', 'UEFI', 'AIO PUMP'], route: 'EPS → VRM → CPU SOCKET', flow: 'mixed', cameraCue: 'cpu' },
  { id: 'memoryTraining', number: '05', title: 'MEMORY TRAINING', description: 'Контроллер памяти определяет параметры модулей и проверяет стабильность передачи данных.', purpose: 'Настроить частоты и тайминги DDR5 перед загрузкой данных.', duration: 3600, components: ['CPU', 'MEMORY CONTROLLER', 'DDR5'], route: 'CPU ↔ RAM', flow: 'data', cameraCue: 'ram' },
  { id: 'gpuInitialization', number: '06', title: 'GPU INITIALIZATION', description: 'Видеокарта инициализирует графический процессор и видеопамять.', purpose: 'Подготовить графический вывод и PCIe-обмен.', duration: 3200, components: ['CPU', 'PCIe', 'GPU', 'VRAM'], route: 'CPU ↔ MOTHERBOARD ↔ GPU', flow: 'mixed', cameraCue: 'gpu' },
  { id: 'storageDetection', number: '07', title: 'STORAGE DETECTION', description: 'UEFI обнаруживает накопитель и находит загрузочные данные.', purpose: 'Найти устройство и раздел, с которого будет запущена ОС.', duration: 3000, components: ['UEFI', 'NVMe SSD', 'CHIPSET'], route: 'CPU / CHIPSET ↔ NVMe SSD', flow: 'data', cameraCue: 'ssd' },
  { id: 'osLoading', number: '08', title: 'OS LOADING', description: 'Данные операционной системы считываются с SSD, помещаются в RAM и обрабатываются CPU.', purpose: 'Разместить код системы в оперативной памяти и начать его выполнение.', duration: 4400, components: ['NVMe SSD', 'CHIPSET', 'DDR5', 'CPU'], route: 'SSD → CHIPSET → RAM → CPU', flow: 'data', cameraCue: 'cooling' },
  { id: 'running', number: '09', title: 'SYSTEM READY', description: 'Операционная система запущена; компоненты обмениваются данными и реагируют на нагрузку.', purpose: 'Выполнять задачи пользователя, управляя питанием и охлаждением.', duration: 0, components: ['CPU', 'RAM', 'GPU', 'STORAGE', 'COOLING'], route: 'SYSTEM-WIDE DATA EXCHANGE', flow: 'data', cameraCue: 'hero' },
  { id: 'shuttingDown', number: '10', title: 'SAFE SHUTDOWN', description: 'Система завершает запись, останавливает обработку и плавно отключает основные линии.', purpose: 'Сохранить данные и вернуть компьютер в безопасное состояние ожидания.', duration: 5200, components: ['OS', 'STORAGE', 'CPU', 'PSU', 'COOLING'], route: 'RAM → SSD · COMPONENTS → OFF · 5VSB', flow: 'mixed', cameraCue: 'hero' },
] as const

export const phaseById = Object.fromEntries(phaseDefinitions.map(phase => [phase.id, phase])) as Record<SystemPhase, PhaseDefinition>
export const bootPhases = phaseDefinitions.slice(1, 10)

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
        const next = phaseDefinitions[Math.min(currentIndex + 1, 9)]
        return { phase: next.id, progress: 0, playing: next.id !== 'running' }
      })
    }, 50)
    return () => window.clearInterval(timer)
  }, [timeline.phase, timeline.playing])

  const powerOn = useCallback(() => setTimeline({ phase: 'psuStarting', progress: 0, playing: true }), [])
  const shutdown = useCallback(() => setTimeline({ phase: 'shuttingDown', progress: 0, playing: true }), [])
  const togglePlay = useCallback(() => setTimeline(current => {
    if (current.phase === 'poweredOff') return { phase: 'psuStarting', progress: 0, playing: true }
    if (current.phase === 'running') return current
    return { ...current, playing: !current.playing }
  }), [])
  const next = useCallback(() => setTimeline(current => {
    if (current.phase === 'shuttingDown') return current
    const currentIndex = phaseDefinitions.findIndex(item => item.id === current.phase)
    const target = phaseDefinitions[Math.min(9, Math.max(1, currentIndex + 1))]
    return { phase: target.id, progress: 0, playing: false }
  }), [])
  const previous = useCallback(() => setTimeline(current => {
    if (current.phase === 'shuttingDown') return current
    const currentIndex = phaseDefinitions.findIndex(item => item.id === current.phase)
    const target = phaseDefinitions[Math.max(1, Math.min(9, currentIndex - 1))]
    return { phase: target.id, progress: 0, playing: false }
  }), [])
  const restart = useCallback(() => setTimeline({ phase: 'psuStarting', progress: 0, playing: true }), [])
  const repeat = useCallback(() => setTimeline(current => ({ ...current, progress: 0, playing: current.phase !== 'poweredOff' && current.phase !== 'running' })), [])
  const skipToRunning = useCallback(() => setTimeline({ phase: 'running', progress: 1, playing: false }), [])
  const pause = useCallback(() => setTimeline(current => ({ ...current, playing: false })), [])

  return { ...timeline, index, definition: phaseById[timeline.phase], powerOn, shutdown, togglePlay, next, previous, restart, repeat, skipToRunning, pause }
}
