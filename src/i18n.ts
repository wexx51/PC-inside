import type { ComponentId, ComponentInfo } from './data/components'
import type { PhaseDefinition, SystemPhase } from './system/bootMachine'

export type Locale = 'ru' | 'en'

export const ui = {
  en: {
    subtitle:'INTERACTIVE COMPUTER ARCHITECTURE LABORATORY', lab:'LAB', system:'SYSTEM', components:'COMPONENTS', architecture:'ARCHITECTURE', about:'ABOUT',
    systemOff:'SYSTEM OFF', shuttingDown:'SHUTTING DOWN', systemReady:'SYSTEM READY', bootSequence:'BOOT SEQUENCE', bootPaused:'BOOT PAUSED',
    liveModel:'LIVE SYSTEM MODEL', internalOpen:'INTERNAL / SIDE OPEN', externalSealed:'EXTERNAL / SEALED', drag:'DRAG TO ORBIT', zoom:'SCROLL TO ZOOM', external:'EXTERNAL', internal:'INTERNAL',
    telemetry:'SYSTEM TELEMETRY', startup:'STARTUP', live:'LIVE', memory:'MEMORY / DDR5', storageActivity:'STORAGE ACTIVITY', cooling:'COOLING', componentExplorer:'COMPONENT EXPLORER',
    offline:'OFFLINE', online:'ONLINE', load:'LOAD', dataPath:'DATA PATH', primarySystems:'PRIMARY SYSTEMS', function:'FUNCTION', specifications:'TECHNICAL CHARACTERISTICS', architectureRole:'ARCHITECTURE ROLE', related:'RELATED', assemble:'ASSEMBLE VIEW', explode:'EXPLODED VIEW',
    bootController:'BOOT CONTROLLER', pause:'PAUSE', play:'PLAY', previous:'PREVIOUS STEP', next:'NEXT STEP', restart:'RESTART', skip:'SKIP TO RUNNING', autoTour:'AUTO TOUR', on:'ON', off:'OFF', guidedTour:'GUIDED TOUR', explainMode:'EXPLAIN MODE', presentationMode:'PRESENTATION MODE', fullscreen:'FULLSCREEN',
    processVisualization:'PROCESS VISUALIZATION', powerOn:'POWER ON', shutDown:'SHUT DOWN', resetView:'RESET VIEW', dataFlow:'DATA FLOW', powerFlow:'POWER FLOW', soundOn:'SOUND ON', soundOff:'SOUND OFF', workload:'WORKLOAD',
    idle:'IDLE', normal:'NORMAL', high:'HIGH', selectComponent:'Select a component', inspector:'HARDWARE INSPECTOR', selectHelp:'Choose a system in the explorer or directly in the laboratory to inspect its purpose, data path, and construction.',
    why:'WHY IT MATTERS', involved:'COMPONENTS', route:'ROUTE', architectureTitle:'System communication topology', architectureText:'Conceptual routing of instructions, data and I/O through the platform.', returnLab:'RETURN TO LAB', disclaimer:'Example hardware specifications are illustrative and are used for educational visualization rather than representing one specific commercial PC.',
  },
  ru: {
    subtitle:'ИНТЕРАКТИВНАЯ ЛАБОРАТОРИЯ АРХИТЕКТУРЫ ПК', lab:'ЛАБОРАТОРИЯ', system:'СИСТЕМА', components:'КОМПОНЕНТЫ', architecture:'АРХИТЕКТУРА', about:'О ПРОЕКТЕ',
    systemOff:'СИСТЕМА ВЫКЛЮЧЕНА', shuttingDown:'ВЫКЛЮЧЕНИЕ', systemReady:'СИСТЕМА ГОТОВА', bootSequence:'ЗАГРУЗКА', bootPaused:'ЗАГРУЗКА НА ПАУЗЕ',
    liveModel:'ЖИВАЯ МОДЕЛЬ СИСТЕМЫ', internalOpen:'ВНУТРЕННИЙ ВИД / ПАНЕЛЬ СНЯТА', externalSealed:'ВНЕШНИЙ ВИД / КОРПУС ЗАКРЫТ', drag:'ВРАЩЕНИЕ МЫШЬЮ', zoom:'МАСШТАБ КОЛЕСОМ', external:'СНАРУЖИ', internal:'ВНУТРИ',
    telemetry:'ТЕЛЕМЕТРИЯ СИСТЕМЫ', startup:'ЗАПУСК', live:'РАБОТАЕТ', memory:'ПАМЯТЬ / DDR5', storageActivity:'АКТИВНОСТЬ SSD', cooling:'ОХЛАЖДЕНИЕ', componentExplorer:'КОМПОНЕНТЫ',
    offline:'ВЫКЛЮЧЕН', online:'РАБОТАЕТ', load:'НАГРУЗКА', dataPath:'ПУТЬ ДАННЫХ', primarySystems:'ОСНОВНЫЕ УЗЛЫ', function:'ФУНКЦИЯ', specifications:'ТЕХНИЧЕСКИЕ ХАРАКТЕРИСТИКИ', architectureRole:'РОЛЬ В АРХИТЕКТУРЕ', related:'СВЯЗАНО С', assemble:'СОБРАТЬ', explode:'РАЗОБРАННЫЙ ВИД',
    bootController:'УПРАВЛЕНИЕ ЗАГРУЗКОЙ', pause:'ПАУЗА', play:'ПУСК', previous:'НАЗАД', next:'ДАЛЬШЕ', restart:'СНАЧАЛА', skip:'К РАБОТАЮЩЕЙ СИСТЕМЕ', autoTour:'АВТОТУР', on:'ВКЛ', off:'ВЫКЛ', guidedTour:'ЭКСКУРСИЯ', explainMode:'ПОЯСНЕНИЯ', presentationMode:'ПРЕЗЕНТАЦИЯ', fullscreen:'НА ВЕСЬ ЭКРАН',
    processVisualization:'ПРОЦЕСС', powerOn:'ВКЛЮЧИТЬ', shutDown:'ВЫКЛЮЧИТЬ', resetView:'ОБЩИЙ ВИД', dataFlow:'ПОТОК ДАННЫХ', powerFlow:'ПИТАНИЕ', soundOn:'ЗВУК ВКЛ', soundOff:'ЗВУК ВЫКЛ', workload:'НАГРУЗКА',
    idle:'ПРОСТОЙ', normal:'ОБЫЧНАЯ', high:'ВЫСОКАЯ', selectComponent:'Выберите компонент', inspector:'ИНСПЕКТОР ОБОРУДОВАНИЯ', selectHelp:'Выберите узел в списке или прямо в сцене, чтобы изучить его назначение, устройство и путь данных.',
    why:'ЗАЧЕМ ЭТО НУЖНО', involved:'УЧАСТВУЮТ', route:'МАРШРУТ', architectureTitle:'Схема взаимодействия компонентов', architectureText:'Упрощённая схема передачи команд, данных и сигналов ввода-вывода.', returnLab:'ВЕРНУТЬСЯ В ЛАБОРАТОРИЮ', disclaimer:'Примеры характеристик оборудования приведены для учебной визуализации и не описывают конкретный коммерческий ПК.',
  },
} as const

export type UiKey = keyof typeof ui.en

const phaseEnglish: Record<SystemPhase, Pick<PhaseDefinition,'title'|'description'|'purpose'>> = {
  poweredOff:{title:'SYSTEM OFF',description:'The main rails are off. The PSU 5VSB standby rail lets the motherboard wait for the power-button signal.',purpose:'Keep the computer in a safe low-power standby state.'},
  powerButton:{title:'POWER BUTTON',description:'Pressing the physical power button signals the standby-powered motherboard controller, which requests the PSU main rails using PS_ON#.',purpose:'Turn the user action into the electrical request that begins startup.'},
  psuStarting:{title:'PSU STARTUP',description:'The PSU receives AC power; 5VSB already exists. It establishes regulated 12 V, 5 V and 3.3 V DC rails, powers the motherboard, then asserts Power Good.',purpose:'Deliver stable, protected DC power before digital hardware is released.'},
  resetRelease:{title:'MOTHERBOARD / CPU RESET RELEASE',description:'After Power Good, motherboard logic releases reset and the CPU begins at its defined reset vector.',purpose:'Prevent the CPU from executing code until power and clocks are stable.'},
  uefiStart:{title:'BIOS / UEFI START',description:'UEFI firmware is stored in non-volatile flash on the motherboard. The CPU begins executing it for early hardware initialization.',purpose:'Initialize enough of the platform to test hardware and find boot software.'},
  post:{title:'POWER-ON SELF-TEST (POST)',description:'UEFI checks or initializes the CPU, RAM, display subsystem, storage, and essential motherboard hardware. POST is not a complete OS diagnostic.',purpose:'Confirm that boot-critical hardware can initialize before loading an operating system.'},
  memoryInitialization:{title:'MEMORY INITIALIZATION / TRAINING',description:'UEFI uses the CPU memory controller to identify RAM and train stable DDR5 timing and signaling.',purpose:'Make temporary working memory available for active operating-system code and data.'},
  gpuInitialization:{title:'GPU / DISPLAY INITIALIZATION',description:'The graphics card initializes its processor and video memory.',purpose:'Prepare display output and PCIe communication.'},
  storageDetection:{title:'STORAGE DETECTION',description:'UEFI detects the NVMe SSD controller and its available storage partitions.',purpose:'Find the device and partition containing the operating system.'},
  bootDeviceSelection:{title:'BOOT DEVICE SELECTION',description:'The UEFI boot manager follows its boot order and selects an EFI entry.',purpose:'Choose a valid, trusted boot file and operating system.'},
  bootloader:{title:'BOOTLOADER',description:'Firmware transfers control to boot software stored on the selected SSD. The bootloader places the kernel and initial system image in RAM.',purpose:'Prepare the kernel, provide its startup parameters, and transfer control to it.'},
  osLoading:{title:'OPERATING SYSTEM KERNEL LOADING',description:'Operating-system code and required data are read from persistent SSD storage into temporary RAM. The CPU executes those instructions.',purpose:'Give the CPU a fast working copy of the kernel while storage retains the permanent copy.'},
  driverInitialization:{title:'DRIVER INITIALIZATION',description:'The OS initializes GPU/display, USB/input, storage, network, and audio drivers.',purpose:'Drivers translate OS operations into device-specific commands so the OS can operate hardware.'},
  systemInitialization:{title:'SYSTEM SERVICES / OS INITIALIZATION',description:'The kernel starts system services, the network stack, the graphical environment, and the user session.',purpose:'Build the complete user environment on top of the running kernel and drivers.'},
  running:{title:'SYSTEM READY',description:'The operating system, drivers, and required services are initialized. The system can accept input and launch applications.',purpose:'Run user tasks while managing processes, devices, power, and cooling.'},
  shuttingDown:{title:'SAFE SHUTDOWN',description:'The system finishes writes, stops processing and smoothly disables the main rails.',purpose:'Preserve data and return the computer to a safe standby state.'},
}

const phaseRussian: Partial<Record<SystemPhase, Pick<PhaseDefinition,'title'>>> = {
  poweredOff:{title:'СИСТЕМА ВЫКЛЮЧЕНА'}, powerButton:{title:'КНОПКА ПИТАНИЯ'}, psuStarting:{title:'ЗАПУСК БЛОКА ПИТАНИЯ'}, resetRelease:{title:'СНЯТИЕ СБРОСА CPU'}, uefiStart:{title:'ЗАПУСК BIOS / UEFI'}, post:{title:'САМОТЕСТИРОВАНИЕ POST'}, memoryInitialization:{title:'ИНИЦИАЛИЗАЦИЯ ПАМЯТИ'}, gpuInitialization:{title:'ИНИЦИАЛИЗАЦИЯ GPU'}, storageDetection:{title:'ПОИСК НАКОПИТЕЛЯ'}, bootDeviceSelection:{title:'ВЫБОР ЗАГРУЗОЧНОГО УСТРОЙСТВА'}, bootloader:{title:'ЗАГРУЗЧИК'}, osLoading:{title:'ЗАГРУЗКА ЯДРА ОС'}, driverInitialization:{title:'ИНИЦИАЛИЗАЦИЯ ДРАЙВЕРОВ'}, systemInitialization:{title:'СЛУЖБЫ / ИНИЦИАЛИЗАЦИЯ ОС'}, running:{title:'СИСТЕМА ГОТОВА'}, shuttingDown:{title:'БЕЗОПАСНОЕ ВЫКЛЮЧЕНИЕ'},
}

export function localizePhase(definition: PhaseDefinition, locale: Locale): PhaseDefinition {
  return locale === 'en' ? {...definition,...phaseEnglish[definition.id]} : {...definition,...phaseRussian[definition.id]}
}

const componentRussian: Record<ComponentId, Pick<ComponentInfo,'name'|'category'|'description'|'parts'>> = {
  monitor:{name:'Монитор',category:'09 / УСТРОЙСТВО ВЫВОДА',description:'Устройство вывода: преобразует сигнал GPU в изображение. Учебный экран синхронизирован с общим контроллером загрузки: UEFI, проверка оборудования, загрузка ОС и рабочий стол PC INSIDE.',parts:['Экран','Корпус','Видеовход','Подставка']},
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
