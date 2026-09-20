export type ComponentId = 'cpu' | 'gpu' | 'motherboard' | 'ram' | 'ssd' | 'psu' | 'cooling' | 'case' | 'monitor'

export type ComponentInfo = {
  id: ComponentId
  name: string
  short: string
  category: string
  color: string
  stat: string
  function: string
  specifications: string[]
  description: string
  dataPath: string
  relatedComponents: ComponentId[]
  architectureRole: string
  parts: string[]
}

export const componentData: Record<ComponentId, ComponentInfo> = {
  monitor: {
    id: 'monitor', name: 'Monitor', short: 'MONITOR', category: '09 / Output Device', color: '#b6a0ff', stat: '16:9 · DIGITAL DISPLAY',
    function: 'Displays visual information produced by the computer.',
    specifications: ['Type: Output Device', '16:9 display panel', 'Digital display input', 'GPU-driven image', 'Standby when no display signal'],
    description: 'An output device that turns the graphics system’s display signal into visible pixels. The educational screen follows the shared boot controller from UEFI and hardware checks through OS loading to the PC INSIDE desktop.',
    dataPath: 'Application → CPU / graphics API → GPU → display output → monitor', relatedComponents: ['cpu', 'gpu'],
    architectureRole: 'Visual output for firmware, the operating system, and applications', parts: ['Display panel', 'Rear housing', 'Digital display input', 'Display cable', 'Stand and base'],
  },
  cpu: {
    id: 'cpu', name: 'Central Processing Unit', short: 'CPU', category: '01 / COMPUTE', color: '#72d5ff', stat: '8 cores / 16 threads · 3.8–4.8 GHz',
    function: 'Fetches, decodes, and executes machine instructions, performs arithmetic and logical operations, and controls program execution.',
    specifications: ['x86-64 example architecture', '8 CPU cores / 16 threads', '3.8 GHz base / up to 4.8 GHz boost', 'L1: 64 KB per core · L2: 1 MB per core · L3: 32 MB shared', 'Clock speed alone does not determine performance'],
    description: 'The CPU executes program instructions and coordinates work with RAM and devices. Core design, cache, memory, workload, and cooling all affect performance—not clock speed alone.',
    dataPath: 'SSD → RAM ↔ CPU → GPU / I/O', relatedComponents: ['ram', 'motherboard', 'ssd', 'gpu'],
    architectureRole: 'Instruction execution and system control', parts: ['Compute cores', 'L3 cache', 'Memory controller', 'Interconnect'],
  },
  gpu: {
    id: 'gpu', name: 'Graphics Processing Unit', short: 'GPU', category: '02 / GRAPHICS', color: '#a894ff', stat: '16 GB VRAM · ~2.2 GHz example boost',
    function: 'Executes highly parallel graphics and compute workloads and produces display frames.',
    specifications: ['16 GB GDDR6 VRAM', '~1.8 GHz base / ~2.2 GHz boost (illustrative)', 'PCIe 4.0 x16 interface', 'Thousands of parallel execution lanes', 'DisplayPort / HDMI display output'],
    description: 'The GPU renders graphics and accelerates highly parallel work. Its many execution lanes process data concurrently, while dedicated VRAM holds frames, textures, and working data before display output.',
    dataPath: 'CPU / RAM → PCIe → GPU ↔ VRAM → DISPLAY', relatedComponents: ['cpu', 'motherboard', 'psu', 'cooling'],
    architectureRole: 'Parallel processing and visual output', parts: ['GPU die', 'GDDR memory', 'VRM stages', 'Vapor heatsink'],
  },
  motherboard: {
    id: 'motherboard', name: 'System Mainboard', short: 'MAINBOARD', category: '03 / PLATFORM', color: '#46ddbb', stat: 'ATX · PCIe 4.0',
    function: 'Provides buses, sockets, firmware, power regulation, and interfaces that connect every subsystem.',
    specifications: ['CPU socket + platform chipset', '4 DIMM / RAM slots', 'PCIe x16 and expansion slots', '2 × M.2 storage slots', 'Rear I/O: USB, audio, Ethernet, display', '24-pin ATX + 8-pin CPU power connectors'],
    description: 'The motherboard is the communication backbone. It distributes power and connects processor, memory, graphics, storage, input/output, and networking.',
    dataPath: 'CPU ↔ MEMORY / PCIe / CHIPSET ↔ I/O', relatedComponents: ['cpu', 'ram', 'gpu', 'ssd', 'psu'],
    architectureRole: 'System interconnect, firmware, and peripheral I/O', parts: ['CPU socket', 'Chipset', 'DIMM slots', 'PCIe slots', 'M.2 slots', 'Rear I/O', '24-pin ATX power', '8-pin CPU power'],
  },
  ram: {
    id: 'ram', name: 'DDR5 Memory', short: 'RAM', category: '04 / MEMORY', color: '#59e9c1', stat: '32 GB · DDR5-6000',
    function: 'Temporarily stores active code and data for low-latency access by the CPU and other devices.',
    specifications: ['32 GB capacity', 'DDR5-6000 (6000 MT/s)', 'Dual-channel', '~96 GB/s theoretical aggregate bandwidth', 'Volatile: contents are lost without power'],
    description: 'RAM is volatile working memory containing active program code and data. It gives the CPU low-latency access while programs run, but loses its contents when power is removed.',
    dataPath: 'CPU MEMORY CONTROLLER ↔ DDR5 CHANNELS ↔ RAM', relatedComponents: ['cpu', 'motherboard', 'ssd'],
    architectureRole: 'Volatile working memory for executing programs', parts: ['Memory banks', 'Address rows', 'Data bus', 'Heat spreader'],
  },
  ssd: {
    id: 'ssd', name: 'NVMe Solid State Drive', short: 'SSD', category: '05 / STORAGE', color: '#50b7ff', stat: '1 TB · PCIe 4.0 x4',
    function: 'Stores firmware-readable boot files, the operating system, applications, and user data without power.',
    specifications: ['1 TB NAND flash', 'NVMe over PCIe 4.0 x4', '~5,000–7,000 MB/s read (illustrative)', '~4,000–6,000 MB/s write (illustrative)', 'Non-volatile storage'],
    description: 'The NVMe SSD keeps data when power is off. Its controller moves blocks between NAND flash and system memory using DMA over PCIe.',
    dataPath: 'NAND ↔ NVMe CONTROLLER ↔ PCIe ↔ RAM / CPU', relatedComponents: ['motherboard', 'ram', 'cpu'],
    architectureRole: 'Persistent storage and boot-device source', parts: ['NAND flash', 'NVMe controller', 'PCIe contacts', 'Thermal plate'],
  },
  psu: {
    id: 'psu', name: 'Power Supply Unit', short: 'PSU', category: '06 / POWER', color: '#ffd27a', stat: '850 W · 80 PLUS Gold',
    function: 'Converts AC mains power into regulated DC rails and protects components from electrical faults.',
    specifications: ['850 W rated output', '80 PLUS Gold efficiency class', '+12 V / +5 V / +3.3 V rails', '5VSB standby rail', 'Over-current / over-voltage protection'],
    description: 'The PSU converts incoming AC power into regulated DC voltages used by computer components, then distributes those rails through ATX, CPU, GPU, and peripheral power cables.',
    dataPath: 'AC → PSU → ATX / EPS / PCIe POWER', relatedComponents: ['motherboard', 'cpu', 'gpu', 'ssd'],
    architectureRole: 'Power conversion, distribution, and protection', parts: ['12 V rail', 'Power conversion', 'Protection circuit', 'Cable harness'],
  },
  cooling: {
    id: 'cooling', name: 'Thermal System', short: 'COOLING', category: '07 / THERMAL', color: '#7fd8ff', stat: 'PWM · 700–1900 RPM',
    function: 'Transfers heat from chips to coolant, heatsinks, and airflow under temperature-based control.',
    specifications: ['360 mm AIO radiator', 'PWM fan control', 'CPU liquid loop', 'GPU heatpipe cooler'],
    description: 'The AIO pump circulates coolant between the CPU cold plate and the top radiator. Fans carry heat out; the GPU has its own heatpipes and fin stack.',
    dataPath: 'SENSORS → FAN CONTROL; CHIPS → COOLER → AIR', relatedComponents: ['cpu', 'gpu', 'case', 'motherboard'],
    architectureRole: 'Thermal regulation that sustains reliable execution', parts: ['Pump & cold plate', 'Coolant tubes', 'Radiator fins', 'PWM fans'],
  },
  case: {
    id: 'case', name: 'Chassis & Airflow', short: 'CASE', category: '08 / ENCLOSURE', color: '#9aacba', stat: 'ATX · FILTERED AIRFLOW',
    function: 'Mechanically supports and protects hardware while defining intake, exhaust, and service access.',
    specifications: ['ATX compatibility', 'Three front intakes', 'Top radiator exhaust', 'Removable side panel'],
    description: 'The chassis protects components while its engineered paths direct cool air across the platform and exhaust heat.',
    dataPath: 'COOL AIR → COMPONENTS → HEATED EXHAUST', relatedComponents: ['cooling', 'motherboard', 'psu'],
    architectureRole: 'Physical enclosure and controlled airflow path', parts: ['Glass panel', 'Steel frame', 'Dust filtration', 'Cable routing'],
  },
}

export const componentList = Object.values(componentData).sort((a, b) => a.category.localeCompare(b.category))
export const componentNames = (ids: readonly ComponentId[]) => ids.map(id => componentData[id].short)
