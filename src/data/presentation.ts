export type PresentationStep = {
  kicker: string
  title: string
  description: string
  route?: string
  points?: readonly string[]
}

const en: readonly PresentationStep[] = [
  { kicker:'01 / INTRODUCTION', title:'PC INSIDE', description:'Interactive Computer Architecture Laboratory. Understand how hardware, firmware, the operating system, and applications cooperate.', points:['Identify core components','Explain startup and program execution','Trace input, output, data, and network flow'] },
  { kicker:'02 / COMPUTER OVERVIEW', title:'One integrated computer system', description:'The case, internal hardware, display, firmware, and software form one connected system.', route:'INPUT → PROCESSING → STORAGE / NETWORK → OUTPUT' },
  { kicker:'03 / COMPONENTS', title:'Core hardware', description:'CPU executes instructions, RAM holds active work, SSD stores files, GPU renders frames, the motherboard connects devices, and the PSU supplies regulated power.', points:['CPU','RAM','GPU','NVMe SSD','Motherboard','PSU'] },
  { kicker:'04 / POWER ON', title:'Electrical startup', description:'The power request reaches the PSU. Stable DC rails and Power Good allow the motherboard to release CPU reset.', route:'POWER BUTTON → MOTHERBOARD → PSU → DC RAILS → POWER GOOD' },
  { kicker:'05 / UEFI + POST', title:'Firmware initializes hardware', description:'UEFI runs from motherboard flash and performs essential POST checks. POST is not a full operating-system diagnostic.', route:'UEFI ↔ CPU · RAM · GPU · STORAGE' },
  { kicker:'06 / STORAGE + BOOTLOADER', title:'Control passes to boot software', description:'UEFI selects the NVMe boot entry. The bootloader begins loading the kernel and initial system image.', route:'UEFI → NVMe SSD → BOOTLOADER → RAM' },
  { kicker:'07 / OS LOADING', title:'Kernel enters working memory', description:'Operating-system code and required data are read from SSD into RAM and executed by the CPU.', route:'SSD → RAM → CPU' },
  { kicker:'08 / DRIVERS + READY', title:'The operating system becomes usable', description:'Drivers initialize display, storage, USB input, network, and audio devices; services start and the desktop becomes ready.', route:'KERNEL → DRIVERS → SERVICES → SYSTEM READY' },
  { kicker:'09 / PROGRAM EXECUTION', title:'Launch Browser', description:'The OS creates a process, reads application files from persistent storage, and loads active code and data into RAM.', route:'USER INPUT → OS → SSD → RAM ↔ CPU' },
  { kicker:'10 / GPU + OUTPUT', title:'Render the browser frame', description:'The application uses the graphics API and driver; the GPU renders the frame and sends it through the display cable.', route:'CPU / APPLICATION → GPU → DISPLAY OUTPUT → MONITOR' },
  { kicker:'11 / NETWORK REQUEST', title:'Send a local simulated request', description:'The browser asks the OS network stack, which uses the network driver and Ethernet / Wi-Fi interface.', route:'BROWSER → OS NETWORK STACK → NETWORK INTERFACE → NETWORK' },
  { kicker:'12 / NETWORK RESPONSE', title:'Receive data into the computer', description:'The network interface receives response data into OS-managed RAM buffers. The CPU and application can now process it.', route:'NETWORK → NETWORK INTERFACE → OS / RAM → CPU' },
  { kicker:'13 / PAGE READY', title:'Render and display the result', description:'The CPU prepares drawing commands, the GPU renders the page, and the final frame travels through the display output to the monitor.', route:'CPU → GPU → DISPLAY OUTPUT → MONITOR' },
  { kicker:'14 / ARCHITECTURE SUMMARY', title:'Hardware and software cooperate', description:'Firmware starts the machine, the OS manages resources and drivers, and applications use CPU, memory, storage, GPU, I/O, and networking.', route:'HARDWARE ↔ FIRMWARE ↔ OPERATING SYSTEM ↔ APPLICATIONS' },
]

const ru: readonly PresentationStep[] = [
  { kicker:'01 / ВВЕДЕНИЕ', title:'PC INSIDE', description:'Интерактивная лаборатория архитектуры компьютера. Цель — понять совместную работу аппаратуры, прошивки, ОС и приложений.', points:['Определить основные компоненты','Объяснить запуск и выполнение программы','Проследить ввод, вывод, данные и сеть'] },
  { kicker:'02 / ОБЗОР КОМПЬЮТЕРА', title:'Единая компьютерная система', description:'Корпус, внутренние компоненты, монитор, прошивка и ПО работают как связанная система.', route:'ВВОД → ОБРАБОТКА → ХРАНЕНИЕ / СЕТЬ → ВЫВОД' },
  { kicker:'03 / КОМПОНЕНТЫ', title:'Основное оборудование', description:'CPU выполняет инструкции, RAM хранит активные данные, SSD — файлы, GPU строит кадры, плата соединяет устройства, PSU подаёт питание.', points:['CPU','RAM','GPU','NVMe SSD','Материнская плата','PSU'] },
  { kicker:'04 / ВКЛЮЧЕНИЕ', title:'Электрический запуск', description:'Запрос питания поступает в PSU. Стабильные линии DC и Power Good позволяют плате снять сброс CPU.', route:'КНОПКА → МАТЕРИНСКАЯ ПЛАТА → PSU → DC → POWER GOOD' },
  { kicker:'05 / UEFI + POST', title:'Прошивка инициализирует оборудование', description:'UEFI запускается из flash-памяти платы и выполняет основные проверки POST. POST не является полной диагностикой ОС.', route:'UEFI ↔ CPU · RAM · GPU · НАКОПИТЕЛЬ' },
  { kicker:'06 / НАКОПИТЕЛЬ + ЗАГРУЗЧИК', title:'Управление переходит загрузчику', description:'UEFI выбирает загрузочную запись NVMe. Загрузчик начинает помещать ядро и начальный образ системы в память.', route:'UEFI → NVMe SSD → ЗАГРУЗЧИК → RAM' },
  { kicker:'07 / ЗАГРУЗКА ОС', title:'Ядро поступает в рабочую память', description:'Код ОС и необходимые данные читаются с SSD в RAM и выполняются процессором.', route:'SSD → RAM → CPU' },
  { kicker:'08 / ДРАЙВЕРЫ + ГОТОВНОСТЬ', title:'Операционная система готова', description:'Драйверы включают экран, накопитель, USB-ввод, сеть и звук; службы запускаются, появляется рабочий стол.', route:'ЯДРО → ДРАЙВЕРЫ → СЛУЖБЫ → СИСТЕМА ГОТОВА' },
  { kicker:'09 / ВЫПОЛНЕНИЕ ПРОГРАММЫ', title:'Запуск Browser', description:'ОС создаёт процесс, читает файлы приложения с накопителя и загружает активный код и данные в RAM.', route:'ВВОД → ОС → SSD → RAM ↔ CPU' },
  { kicker:'10 / GPU + ВЫВОД', title:'Формирование кадра браузера', description:'Приложение использует графический API и драйвер; GPU строит кадр и отправляет его по кабелю монитору.', route:'CPU / ПРИЛОЖЕНИЕ → GPU → ВИДЕОВЫХОД → МОНИТОР' },
  { kicker:'11 / СЕТЕВОЙ ЗАПРОС', title:'Отправка локального запроса', description:'Браузер обращается к сетевому стеку ОС, который использует драйвер и интерфейс Ethernet / Wi-Fi.', route:'БРАУЗЕР → СЕТЕВОЙ СТЕК ОС → СЕТЕВОЙ ИНТЕРФЕЙС → СЕТЬ' },
  { kicker:'12 / СЕТЕВОЙ ОТВЕТ', title:'Данные поступают в компьютер', description:'Сетевой интерфейс принимает ответ в буферы RAM под управлением ОС. CPU и приложение могут обработать его.', route:'СЕТЬ → СЕТЕВОЙ ИНТЕРФЕЙС → ОС / RAM → CPU' },
  { kicker:'13 / СТРАНИЦА ГОТОВА', title:'Отрисовать и показать результат', description:'CPU готовит команды рисования, GPU строит страницу, а готовый кадр поступает по видеовыходу на монитор.', route:'CPU → GPU → ВИДЕОВЫХОД → МОНИТОР' },
  { kicker:'14 / ИТОГ', title:'Аппаратура и ПО работают совместно', description:'Прошивка запускает ПК, ОС управляет ресурсами и драйверами, приложения используют CPU, память, накопитель, GPU, ввод-вывод и сеть.', route:'АППАРАТУРА ↔ ПРОШИВКА ↔ ОС ↔ ПРИЛОЖЕНИЯ' },
]

export const presentationSteps = { en, ru } as const
