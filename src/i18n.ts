import type { ComponentId, ComponentInfo } from './data/components'
import type { PhaseDefinition, SystemPhase } from './system/bootMachine'

export type Locale = 'ru' | 'en'

export const ui = {
  en: {
    subtitle:'INTERACTIVE COMPUTER ARCHITECTURE LABORATORY', lab:'LAB', system:'SYSTEM', components:'COMPONENTS', architecture:'ARCHITECTURE',
    systemOff:'SYSTEM OFF', shuttingDown:'SHUTTING DOWN', systemReady:'SYSTEM READY', bootSequence:'BOOT SEQUENCE', bootPaused:'BOOT PAUSED',
    liveModel:'LIVE SYSTEM MODEL', internalOpen:'INTERNAL / SIDE OPEN', externalSealed:'EXTERNAL / SEALED', drag:'DRAG TO ORBIT', zoom:'SCROLL TO ZOOM', external:'EXTERNAL', internal:'INTERNAL',
    telemetry:'SYSTEM TELEMETRY', startup:'STARTUP', live:'LIVE', memory:'MEMORY / DDR5', storageActivity:'STORAGE ACTIVITY', cooling:'COOLING', componentExplorer:'COMPONENT EXPLORER',
    offline:'OFFLINE', online:'ONLINE', load:'LOAD', dataPath:'DATA PATH', primarySystems:'PRIMARY SYSTEMS', assemble:'ASSEMBLE VIEW', explode:'EXPLODED VIEW',
    bootController:'BOOT CONTROLLER', pause:'PAUSE', play:'PLAY', previous:'PREVIOUS STEP', next:'NEXT STEP', restart:'RESTART', skip:'SKIP TO RUNNING', autoTour:'AUTO TOUR', on:'ON', off:'OFF', guidedTour:'GUIDED TOUR', explainMode:'EXPLAIN MODE', presentationMode:'PRESENTATION MODE', fullscreen:'FULLSCREEN',
    processVisualization:'PROCESS VISUALIZATION', powerOn:'POWER ON', shutDown:'SHUT DOWN', resetView:'RESET VIEW', dataFlow:'DATA FLOW', powerFlow:'POWER FLOW', soundOn:'SOUND ON', soundOff:'SOUND OFF', workload:'WORKLOAD',
    idle:'IDLE', normal:'NORMAL', high:'HIGH', selectComponent:'Select a component', inspector:'HARDWARE INSPECTOR', selectHelp:'Choose a system in the explorer or directly in the laboratory to inspect its purpose, data path, and construction.',
    why:'WHY IT MATTERS', involved:'COMPONENTS', route:'ROUTE', architectureTitle:'System communication topology', architectureText:'Conceptual routing of instructions, data and I/O through the platform.', returnLab:'RETURN TO LAB', disclaimer:'This is a simplified educational simulation. Values and internal visualizations are illustrative.',
  },
  ru: {
    subtitle:'ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ АРХИТЕКТУРЫ ПК', lab:'ЛАБОРАТОРИЯ', system:'СИСТЕМА', components:'КОМПОНЕНТЫ', architecture:'АРХИТЕКТУРА',
    systemOff:'СИСТЕМА ВЫКЛЮЧЕНА', shuttingDown:'ВЫКЛЮЧЕНИЕ', systemReady:'СИСТЕМА ГОТОВА', bootSequence:'ЗАГРУЗКА', bootPaused:'ЗАГРУЗКА НА ПАУЗЕ',
    liveModel:'ЖИВАЯ МОДЕЛЬ СИСТЕМЫ', internalOpen:'ВНУТРЕННИЙ ВИД / ПАНЕЛЬ СНЯТА', externalSealed:'ВНЕШНИЙ ВИД / КОРПУС ЗАКРЫТ', drag:'ВРАЩЕНИЕ МЫШЬЮ', zoom:'МАСШТАБ КОЛЕСОМ', external:'СНАРУЖИ', internal:'ВНУТРИ',
    telemetry:'ТЕЛЕМЕТРИЯ СИСТЕМЫ', startup:'ЗАПУСК', live:'РАБОТАЕТ', memory:'ПАМЯТЬ / DDR5', storageActivity:'АКТИВНОСТЬ SSD', cooling:'ОХЛАЖДЕНИЕ', componentExplorer:'КОМПОНЕНТЫ',
    offline:'ВЫКЛЮЧЕН', online:'РАБОТАЕТ', load:'НАГРУЗКА', dataPath:'ПУТЬ ДАННЫХ', primarySystems:'ОСНОВНЫЕ УЗЛЫ', assemble:'СОБРАТЬ', explode:'РАЗОБРАННЫЙ ВИД',
    bootController:'УПРАВЛЕНИЕ ЗАГРУЗКОЙ', pause:'ПАУЗА', play:'ПУСК', previous:'НАЗАД', next:'ДАЛЬШЕ', restart:'СНАЧАЛА', skip:'К РАБОТАЮЩЕЙ СИСТЕМЕ', autoTour:'АВТОТУР', on:'ВКЛ', off:'ВЫКЛ', guidedTour:'ЭКСКУРСИЯ', explainMode:'ПОЯСНЕНИЯ', presentationMode:'ПРЕЗЕНТАЦИЯ', fullscreen:'НА ВЕСЬ ЭКРАН',
    processVisualization:'ПРОЦЕСС', powerOn:'ВКЛЮЧИТЬ', shutDown:'ВЫКЛЮЧИТЬ', resetView:'ОБЩИЙ ВИД', dataFlow:'ПОТОК ДАННЫХ', powerFlow:'ПИТАНИЕ', soundOn:'ЗВУК ВКЛ', soundOff:'ЗВУК ВЫКЛ', workload:'НАГРУЗКА',
    idle:'ПРОСТОЙ', normal:'ОБЫЧНАЯ', high:'ВЫСОКАЯ', selectComponent:'Выберите компонент', inspector:'ИНСПЕКТОР ОБОРУДОВАНИЯ', selectHelp:'Выберите узел в списке или прямо в сцене, чтобы изучить его назначение, устройство и путь данных.',
    why:'ЗАЧЕМ ЭТО НУЖНО', involved:'УЧАСТВУЮТ', route:'МАРШРУТ', architectureTitle:'Схема взаимодействия компонентов', architectureText:'Упрощённая схема передачи команд, данных и сигналов ввода-вывода.', returnLab:'ВЕРНУТЬСЯ В ЛАБОРАТОРИЮ', disclaimer:'Упрощённая учебная симуляция. Значения и внутренние процессы показаны наглядно.',
  },
} as const

export type UiKey = keyof typeof ui.en

const phaseEnglish: Record<SystemPhase, Pick<PhaseDefinition,'title'|'description'|'purpose'>> = {
  poweredOff:{title:'SYSTEM OFF',description:'The main power rails are off. The motherboard is waiting for the power-button signal.',purpose:'Keep the computer in a safe low-power standby state.'},
  psuStarting:{title:'PSU STARTUP',description:'The power supply converts wall AC into stable DC voltage rails.',purpose:'Prepare clean, protected voltages for every component.'},
  standbyPower:{title:'STANDBY POWER',description:'The 5VSB rail lets the motherboard process the power-button signal.',purpose:'Power the controller that requests the PSU main rails.'},
  motherboardPower:{title:'MAIN POWER RAILS',description:'Power is distributed through the 24-pin ATX, EPS and PCIe cables.',purpose:'Deliver the correct voltage to the board, CPU, GPU and drives.'},
  cpuInitialization:{title:'CPU INITIALIZATION',description:'The processor starts UEFI firmware and begins the first hardware checks.',purpose:'Transfer control from the startup circuitry to firmware code.'},
  memoryTraining:{title:'MEMORY TRAINING',description:'The memory controller detects the modules and tests stable data transfer.',purpose:'Configure DDR5 frequency and timings before loading data.'},
  gpuInitialization:{title:'GPU INITIALIZATION',description:'The graphics card initializes its processor and video memory.',purpose:'Prepare display output and PCIe communication.'},
  storageDetection:{title:'STORAGE DETECTION',description:'UEFI detects the drive and locates boot data.',purpose:'Find the device and partition containing the operating system.'},
  osLoading:{title:'OS LOADING',description:'System data moves from the SSD into RAM and is processed by the CPU.',purpose:'Place operating-system code in memory and begin executing it.'},
  running:{title:'SYSTEM READY',description:'The operating system is running; components exchange data and respond to workload.',purpose:'Run user tasks while managing power and cooling.'},
  shuttingDown:{title:'SAFE SHUTDOWN',description:'The system finishes writes, stops processing and smoothly disables the main rails.',purpose:'Preserve data and return the computer to a safe standby state.'},
}

const phaseRussian: Partial<Record<SystemPhase, Pick<PhaseDefinition,'title'>>> = {
  poweredOff:{title:'СИСТЕМА ВЫКЛЮЧЕНА'}, psuStarting:{title:'ЗАПУСК БЛОКА ПИТАНИЯ'}, standbyPower:{title:'ДЕЖУРНОЕ ПИТАНИЕ'}, motherboardPower:{title:'ОСНОВНЫЕ ЛИНИИ ПИТАНИЯ'}, cpuInitialization:{title:'ИНИЦИАЛИЗАЦИЯ CPU'}, memoryTraining:{title:'НАСТРОЙКА ПАМЯТИ'}, gpuInitialization:{title:'ИНИЦИАЛИЗАЦИЯ GPU'}, storageDetection:{title:'ПОИСК НАКОПИТЕЛЯ'}, osLoading:{title:'ЗАГРУЗКА ОС'}, running:{title:'СИСТЕМА ГОТОВА'}, shuttingDown:{title:'БЕЗОПАСНОЕ ВЫКЛЮЧЕНИЕ'},
}

export function localizePhase(definition: PhaseDefinition, locale: Locale): PhaseDefinition {
  return locale === 'en' ? {...definition,...phaseEnglish[definition.id]} : {...definition,...phaseRussian[definition.id]}
}

const componentRussian: Record<ComponentId, Pick<ComponentInfo,'name'|'category'|'description'|'parts'>> = {
  cpu:{name:'Центральный процессор',category:'01 / ВЫЧИСЛЕНИЯ',description:'CPU выполняет инструкции программ, координирует ресурсы и распределяет задачи между узлами компьютера.',parts:['Вычислительные ядра','Кэш L3','Контроллер памяти','Межсоединения']},
  gpu:{name:'Графический процессор',category:'02 / ГРАФИКА',description:'GPU ускоряет графику и параллельные вычисления. Тысячи небольших блоков одновременно обрабатывают пиксели и данные.',parts:['Кристалл GPU','Память GDDR','Силовые каскады VRM','Радиатор']},
  motherboard:{name:'Материнская плата',category:'03 / ПЛАТФОРМА',description:'Материнская плата связывает компоненты, распределяет питание и соединяет CPU, память, графику, накопители и устройства ввода-вывода.',parts:['Шина PCIe','Питание VRM','Каналы DIMM','Контроллер ввода-вывода']},
  ram:{name:'Оперативная память DDR5',category:'04 / ПАМЯТЬ',description:'RAM хранит активные программы и данные, чтобы процессор получал к ним доступ с минимальной задержкой.',parts:['Банки памяти','Строки адресов','Шина данных','Теплораспределитель']},
  ssd:{name:'Твердотельный накопитель NVMe',category:'05 / ХРАНЕНИЕ',description:'NVMe SSD сохраняет данные без питания. Контроллер передаёт блоки между NAND-памятью и RAM по PCIe.',parts:['NAND-память','Контроллер NVMe','Контакты PCIe','Тепловая пластина']},
  psu:{name:'Блок питания',category:'06 / ПИТАНИЕ',description:'Блок питания преобразует напряжение сети в стабильные линии постоянного тока и распределяет энергию по системе.',parts:['Линия 12 В','Преобразователь','Схемы защиты','Кабели питания']},
  cooling:{name:'Система охлаждения',category:'07 / ОХЛАЖДЕНИЕ',description:'Помпа AIO переносит тепло от процессора к верхнему радиатору. Вентиляторы выводят тепло из корпуса, а GPU использует собственный радиатор и тепловые трубки.',parts:['Помпа и cold plate','Трубки охлаждения','Радиатор','PWM-вентиляторы']},
  case:{name:'Корпус и воздушный поток',category:'08 / КОРПУС',description:'Корпус защищает компоненты и направляет прохладный воздух через систему, выводя нагретый воздух наружу.',parts:['Стеклянная панель','Стальная рама','Пылевой фильтр','Кабельные каналы']},
}

export function localizeComponent(component: ComponentInfo, locale: Locale): ComponentInfo {
  return locale === 'en' ? component : {...component,...componentRussian[component.id]}
}
