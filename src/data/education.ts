import type { ComponentId } from './components'

export type ConceptId = 'firmware' | 'post' | 'boot-device' | 'bootloader' | 'operating-system' | 'drivers' | 'input-output' | 'input-devices' | 'output-devices' | 'network' | 'application'

export type ArchitectureConcept = {
  id: ConceptId
  name: string
  category: string
  function: string
  specifications: string[]
  description: string
  dataPath: string
  relatedComponents: ComponentId[]
  architectureRole: string
}

export const architectureConcepts: Record<ConceptId, ArchitectureConcept> = {
  firmware: { id:'firmware', name:'BIOS / UEFI firmware', category:'FIRMWARE', function:'Begins early hardware initialization, participates in POST, detects hardware, selects a boot device, and starts the boot process.', specifications:['Firmware stored in non-volatile motherboard flash','Runs before the operating system','Configures hardware and UEFI boot entries','Not a separate physical box'], description:'Modern PCs normally use UEFI, the successor to legacy BIOS. After CPU reset it initializes essential hardware, participates in POST, detects boot devices, and hands control to a selected bootloader.', dataPath:'CPU RESET → MOTHERBOARD FLASH / UEFI → POST → BOOT DEVICE → BOOTLOADER', relatedComponents:['motherboard','cpu','ram','ssd'], architectureRole:'First software layer after electrical startup' },
  post: { id:'post', name:'Power-On Self-Test', category:'STARTUP', function:'Checks that essential hardware can initialize and reports faults.', specifications:['CPU check','RAM check before later training','GPU / display check','Storage and essential motherboard checks'], description:'POST means Power-On Self-Test. It is not a full operating-system diagnostic. It verifies the minimum platform needed to continue booting and stops or reports an error when critical hardware fails.', dataPath:'UEFI ↔ CPU / RAM / GPU / STORAGE', relatedComponents:['cpu','ram','gpu','ssd','motherboard'], architectureRole:'Boot-time hardware validation' },
  'boot-device': { id:'boot-device', name:'Boot device selection', category:'STARTUP', function:'Chooses a valid boot entry according to UEFI configuration.', specifications:['UEFI boot order','GPT system partition','Fallback entries','Secure Boot policy'], description:'Firmware examines configured boot entries and selects an EFI executable from a bootable storage device or network source.', dataPath:'UEFI NVRAM → BOOT ORDER → EFI SYSTEM PARTITION', relatedComponents:['motherboard','ssd'], architectureRole:'Bridge from firmware to the selected operating system' },
  bootloader: { id:'bootloader', name:'Bootloader', category:'SYSTEM SOFTWARE', function:'Loads the operating-system kernel and initial system image, then transfers control.', specifications:['EFI executable','Kernel selection','Boot parameters','Initial RAM filesystem'], description:'The bootloader is selected by UEFI. It locates the OS kernel, places required files in RAM, supplies startup parameters, and jumps to the kernel entry point.', dataPath:'SSD → BOOTLOADER → RAM → CPU', relatedComponents:['ssd','ram','cpu'], architectureRole:'Transfers control from firmware to the OS kernel' },
  'operating-system': { id:'operating-system', name:'Operating system', category:'SYSTEM SOFTWARE', function:'Manages processes, virtual memory, files, security, and hardware resources.', specifications:['Kernel and system services','Process scheduler','Virtual memory','File systems and networking'], description:'The kernel initializes core services, creates protected process environments, and schedules application threads on CPU cores.', dataPath:'STORAGE ↔ RAM ↔ CPU ↔ DEVICES', relatedComponents:['cpu','ram','ssd','motherboard'], architectureRole:'Resource manager between applications and hardware' },
  drivers: { id:'drivers', name:'Device drivers', category:'SYSTEM SOFTWARE', function:'Translate operating-system requests into device-specific commands and handle interrupts.', specifications:['Kernel/device interface','Interrupt handling','DMA coordination','Power management'], description:'Drivers configure discovered devices and expose stable interfaces for graphics, storage, USB, audio, and networking.', dataPath:'APPLICATION → OS API → DRIVER → DEVICE', relatedComponents:['motherboard','gpu','ssd'], architectureRole:'Controlled hardware access for the operating system' },
  'input-output': { id:'input-output', name:'Input / Output', category:'INTERFACE', function:'Moves user input and program output between peripherals, memory, and processors.', specifications:['Keyboard, mouse, and microphone input','Monitor and speaker output','USB, display, and audio interfaces','Drivers, interrupts, and DMA'], description:'Input and output paths cross controllers, device drivers, operating-system services, and applications. The motherboard rear I/O provides many of the physical connection points.', dataPath:'INPUT DEVICE → DRIVER / OS → APPLICATION → GRAPHICS / AUDIO → OUTPUT DEVICE', relatedComponents:['motherboard','cpu','ram','gpu'], architectureRole:'Interaction boundary between the computer and its users/devices' },
  'input-devices': { id:'input-devices', name:'Input devices', category:'PERIPHERALS', function:'Convert user actions or sound into digital events and data that software can process.', specifications:['Keyboard: key events','Mouse: motion, buttons, and scrolling','Microphone: sampled audio','USB or audio interface controller'], description:'A controller receives keyboard, mouse, or microphone data. A driver exposes it through the operating system, which delivers the event or stream to an application.', dataPath:'USER → KEYBOARD / MOUSE / MICROPHONE → USB / INTERFACE CONTROLLER → DRIVER → OPERATING SYSTEM → APPLICATION', relatedComponents:['motherboard','cpu','ram'], architectureRole:'Carries user commands and captured data into software' },
  'output-devices': { id:'output-devices', name:'Output devices', category:'PERIPHERALS', function:'Present processed visual or audio information to the user.', specifications:['Monitor: pixels and frames','Speakers: converted digital audio','DisplayPort / HDMI display link','Audio codec / output interface'], description:'Software sends graphics work through the GPU and display output to a monitor. Audio travels through the OS audio subsystem and hardware output to speakers.', dataPath:'APPLICATION → GRAPHICS SYSTEM → GPU → DISPLAY OUTPUT → MONITOR; SOFTWARE → AUDIO SUBSYSTEM → SPEAKERS', relatedComponents:['gpu','motherboard','cpu','ram'], architectureRole:'Converts computed results into visible or audible output' },
  network: { id:'network', name:'Network interface', category:'INTERFACE', function:'Sends and receives data through Ethernet or Wi-Fi between the computer and a local network or the Internet.', specifications:['Ethernet or Wi-Fi controller','MAC addressing and framed data','DMA packet buffers in RAM','Driver and OS protocol stack','Outbound: Application → OS Network Stack → Network Interface → Network','Inbound: Network → Network Interface → OS / RAM → Application'], description:'For outgoing data, an application uses the OS network stack and driver before the network interface transmits it. Incoming data follows the reverse direction to the application.', dataPath:'APPLICATION ↔ OS NETWORK STACK ↔ ETHERNET / WI-FI INTERFACE ↔ LOCAL NETWORK / INTERNET', relatedComponents:['motherboard','ram','cpu'], architectureRole:'Communication boundary between local software and remote systems' },
  application: { id:'application', name:'Application execution', category:'PROGRAM EXECUTION', function:'Turns a user request into scheduled instructions, memory operations, I/O, graphics, and network work.', specifications:['Executable file and libraries','Process and threads','Virtual address space','System calls'], description:'Launching an application creates a process, maps executable pages from SSD into RAM, schedules its instructions on the CPU, and uses drivers for output, input, and networking.', dataPath:'INPUT → OS → SSD → RAM ↔ CPU → GPU / I/O / NETWORK', relatedComponents:['ssd','ram','cpu','gpu','motherboard'], architectureRole:'User-level workload produced by the complete architecture' },
}

export const requiredConceptIds = ['firmware','post','boot-device','bootloader','operating-system','drivers','input-devices','output-devices','network'] as const

export type StorageComparisonRow = {
  name: string
  technology: string
  interface: string
  capacity: string
  read: string
  write: string
  responsiveness: string
}

export const storageComparison: readonly StorageComparisonRow[] = [
  { name:'HDD', technology:'Magnetic spinning platters + moving head', interface:'SATA', capacity:'1–22 TB examples', read:'~100–250 MB/s', write:'~100–250 MB/s', responsiveness:'Highest latency; mechanical seek time' },
  { name:'SATA SSD', technology:'NAND flash, no moving parts', interface:'SATA III', capacity:'500 GB–4 TB examples', read:'~450–550 MB/s', write:'~400–520 MB/s', responsiveness:'Low latency; much faster response than HDD' },
  { name:'NVMe SSD', technology:'NAND flash + parallel NVMe queues', interface:'PCIe 4.0 (example)', capacity:'1–4 TB examples', read:'~5,000–7,000 MB/s', write:'~4,000–6,000 MB/s', responsiveness:'Low latency; strong parallel I/O, workload dependent' },
] as const

export const assignment = {
  title: 'PC INSIDE', subtitle: 'Interactive Computer Architecture Laboratory',
  goal: 'Understand how hardware, firmware, the operating system, and applications interact during computer startup and program execution.',
  learningObjectives: ['Identify the main computer components','Explain CPU, RAM, GPU, storage, motherboard and PSU','Explain the computer startup sequence','Explain BIOS / UEFI','Explain POST','Explain bootloader and operating system loading','Explain drivers','Explain data and instruction flow','Explain program execution','Explain input and output','Explain network communication'],
} as const

export const assignmentRussian = {
  ...assignment,
  subtitle: 'Интерактивная лаборатория архитектуры компьютера',
  goal: 'Понять, как аппаратное обеспечение, прошивка, операционная система и приложения взаимодействуют при запуске компьютера и выполнении программ.',
  learningObjectives: ['Определить основные компоненты компьютера','Объяснить роль CPU, RAM, GPU, накопителя, материнской платы и PSU','Объяснить последовательность запуска компьютера','Объяснить BIOS / UEFI','Объяснить POST','Объяснить загрузчик и загрузку операционной системы','Объяснить драйверы','Объяснить поток данных и инструкций','Объяснить выполнение программ','Объяснить ввод и вывод','Объяснить сетевое взаимодействие'],
} as const

export const motherboardConnections = ['CPU socket ↔ CPU','Chipset ↔ storage / USB / I/O','DIMM slots ↔ RAM','PCIe x16 slot ↔ GPU','M.2 slots ↔ NVMe SSD','Rear I/O ↔ USB / audio / Ethernet','24-pin ATX ↔ board power','8-pin CPU / EPS ↔ CPU power'] as const

export type ExecutionMode = 'OVERVIEW' | 'POWER' | 'CPU TASK' | 'MEMORY' | 'GRAPHICS' | 'STORAGE' | 'I/O' | 'NETWORK' | 'APPLICATION' | 'COOLING'
export const executionModes: readonly ExecutionMode[] = ['OVERVIEW','POWER','CPU TASK','MEMORY','GRAPHICS','STORAGE','I/O','NETWORK','APPLICATION','COOLING']
export const executionLessons: Partial<Record<ExecutionMode, { title: string; summary: string; steps: readonly string[]; concept: ConceptId }>> = {
  APPLICATION: { title:'Launching a graphics application', summary:'Follow one application from a user action to instructions, frames, and optional network traffic.', concept:'application', steps:['Input reaches the OS through a device driver.','The OS reads the executable and libraries from SSD into RAM.','The scheduler gives the process CPU time; the CPU fetches, decodes, and executes instructions.','System calls request files, network data, and GPU commands.','The GPU renders a frame and sends it to the display.'] },
  'I/O': { title:'Input and output interaction', summary:'Drivers and the OS isolate applications from device-specific protocols.', concept:'input-output', steps:['A peripheral produces an event or data.','The controller transfers data and signals an interrupt.','Its driver reports a standard event to the OS.','The OS delivers it to the application; output returns through a device driver.'] },
  NETWORK: { title:'Network interaction', summary:'Packets cross hardware, driver, kernel protocol stack, and application boundaries.', concept:'network', steps:['The network controller places received packet data in RAM using DMA.','An interrupt tells the driver that data is ready.','The OS stack processes Ethernet, IP, and transport headers.','The application reads the payload through a socket; sending follows the reverse path.'] },
  'CPU TASK': { title:'Instruction cycle', summary:'The CPU repeatedly fetches, decodes, executes, and retires instructions.', concept:'application', steps:['Fetch the next instruction from cache or RAM.','Decode the opcode and operands.','Execute arithmetic, logic, branch, or memory work.','Store the result and advance or redirect the instruction pointer.'] },
}
