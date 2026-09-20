import { type ExecutionSnapshot } from '../system/executionMachine'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, RoundedBox, Stars } from '@react-three/drei'
import { memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ComponentId } from '../data/components'
import type { ExecutionMode } from '../data/education'
import type { SystemPhase } from '../system/bootMachine'
import { CameraDirector } from './CameraDirector'
import { Monitor } from './Monitor'
import { GPU_DISPLAY_OUTPUT } from './displayLayout'
import { AIOCooler } from './cooling/AIOCooler'
import { Fan } from './cooling/Fan'
import { BOARD_POSITION, BOARD_SCALE, CASE_WIDTH_SCALE, CASE_YAW, CPU_MOUNT, GPU_MOUNT, RAM_MOUNT, SSD_MOUNT, PUMP_MOUNT, PSU_MOUNT, boardPoint } from './layout'

type Props = { execution: ExecutionSnapshot; selected: ComponentId | null; onSelect: (id: ComponentId) => void; internal: boolean; dataFlow: boolean; powerFlow: boolean; exploded: boolean; load: number; fanRpm: number; cpuTemp: number; gpuTemp: number; systemPhase: SystemPhase; systemProgress: number; processMode: ExecutionMode; resetToken: number; focusToken: number; guidedTour: boolean; cameraPaused: boolean; onManualCamera: () => void }
const colors = { steel: '#334750', black: '#172229', pcb: '#173a33', trace: '#67b99b', aluminum: '#91a0a6', copper: '#c9885a', rgb: '#83dcff', violet: '#9a8cff', rubber: '#202b30', gold: '#d8b96b' }
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const FRONT_FAN_Y = [-1.34, 1.22, 3.78] as const
const CASE_GEOMETRY = {
  width: 7.7,
  depth: 5.24,
  centerZ: -1.005,
  frontPostZ: 1.465,
  glassZ: 1.5,
  sideWallDepth: 4.94,
  grilleDepth: 4.64,
  shroudDepth: 4.69,
  shroudCenterZ: -1.105,
  frontFaceZ: 1.19,
} as const

export function PCScene(props: Props & { deskToken: number }) {
  const powered = props.systemPhase !== 'poweredOff'
  return <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.75]} camera={{ position: [10.3, 6.2, 11.5], fov: 33 }} gl={{ antialias: true, toneMappingExposure: 1.55 }}>
    <color attach="background" args={['#1b3440']} />
    <ambientLight intensity={powered ? 1.48 : 1.28} /><hemisphereLight args={['#ffffff', '#7894a0', powered ? 1.82 : 1.52]} />
    <directionalLight position={[-4, 4, 9]} intensity={powered ? 3.7 : 2.35} color="#eafaff" />
    <directionalLight position={[5, 12, 9]} intensity={powered ? 4.7 : 2.9} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0001} />
    <spotLight position={[-8, 7, 7]} intensity={powered ? 132 : 68} angle={0.52} penumbra={0.92} color="#9ee5fa" distance={25} />
    <pointLight position={[3, 5, -5]} intensity={powered ? 42 : 15} color="#c9c3ff" distance={12} /><pointLight position={[0, -1, 5]} intensity={powered ? 28 : 13} color="#b5f2ff" distance={10} />
    <Assembly {...props} /><ContactShadows position={[0, -3.05, 0]} opacity={0.48} scale={24} blur={2.5} far={8} /><Stars radius={28} depth={16} count={250} factor={1.2} saturation={0} />
    <Environment resolution={128}><Lightformer position={[0, 7, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} intensity={2.6} /><Lightformer position={[-6, 3, 5]} scale={[5, 8, 1]} intensity={2.7} color="#c5eaff" /></Environment>
    <CameraDirector selected={props.selected} deskToken={props.deskToken} focusToken={props.focusToken} resetToken={props.resetToken} internal={props.internal} guidedTour={props.guidedTour} paused={props.cameraPaused} onManualControl={props.onManualCamera} />
  </Canvas>
}

function Assembly(props: Props) {
  const boardDetail = props.exploded && props.selected === 'motherboard'
  return <group position={[0, -0.05, 0]}>
    <StudioFloor /><group name="chassis" rotation={[0, CASE_YAW, 0]}><group scale={[CASE_WIDTH_SCALE, 1, 1]}><PowerManagedGroup powered={props.systemPhase !== 'poweredOff'}><Case internal={props.internal} fanRpm={props.fanRpm} powered={props.systemPhase !== 'poweredOff'} />
    <Selectable id="motherboard" {...props}><MemoMotherboard />{props.selected === 'motherboard' && <MotherboardHotspots />}</Selectable>
    <Selectable id="cpu" {...props}><group position={[0, 0, boardDetail ? .65 : 0]}><CPU detail={props.exploded && props.selected === 'cpu'} /></group></Selectable>
    <Selectable id="ram" {...props}><group position={[0, 0, boardDetail ? 1 : 0]}><MemoMemory /></group></Selectable>
    <Selectable id="ssd" {...props}><group position={[0, 0, boardDetail ? .75 : 0]}><MemoNVMe /></group></Selectable>
    <Selectable id="gpu" {...props}><GraphicsCard exploded={boardDetail || (props.exploded && props.selected === 'gpu')} load={props.load} fanRpm={props.fanRpm} /></Selectable>
    <Selectable id="cooling" {...props}><AIOCooler fanRpm={props.fanRpm} temperature={props.cpuTemp} powered={!['poweredOff','powerButton','psuStarting'].includes(props.systemPhase) && !(props.systemPhase==='shuttingDown'&&props.systemProgress>.62)} exploded={boardDetail || (props.exploded && props.selected === 'cpu')} /></Selectable>
    <Selectable id="psu" {...props}><PowerSupply load={props.load} fanRpm={props.fanRpm} /></Selectable>
    <Selectable id="case" {...props}><ChassisDetails internal={props.internal} /></Selectable>
    <MemoCableHarness power={props.powerFlow || ['powerButton','psuStarting','resetRelease','uefiStart','gpuInitialization'].includes(props.systemPhase)} /></PowerManagedGroup>
    <ProcessVisualization phase={props.systemPhase} progress={props.systemProgress} mode={props.processMode} dataEnabled={props.dataFlow && props.execution.state === 'IDLE'} powerEnabled={props.powerFlow} cpuTemp={props.cpuTemp} gpuTemp={props.gpuTemp} fanRpm={props.fanRpm} />
    {props.systemPhase === 'running' && props.execution.state !== 'IDLE' && <ExecutionVisualization execution={props.execution} enabled={props.dataFlow} />}
    <Monitor execution={props.execution} phase={props.systemPhase} progress={props.systemProgress} dataFlow={props.dataFlow} onSelect={() => props.onSelect('monitor')} /></group></group>
  </group>
}

function PowerManagedGroup({powered,children}:{powered:boolean;children:React.ReactNode}) {
  const group=useRef<THREE.Group>(null)
  useEffect(()=>{group.current?.traverse(object=>{if(!(object instanceof THREE.Mesh))return;const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach((material:THREE.Material&{emissiveIntensity?:number})=>{if(material.emissiveIntensity===undefined)return;if(material.userData.poweredIntensity===undefined)material.userData.poweredIntensity=material.emissiveIntensity;material.emissiveIntensity=powered?Number(material.userData.poweredIntensity):Number(material.userData.poweredIntensity)*.03;material.needsUpdate=true})})},[powered])
  return <group ref={group}>{children}</group>
}

function Selectable({ id, selected, onSelect, children }: { id: ComponentId; selected: ComponentId | null; onSelect: (id: ComponentId) => void; children: React.ReactNode }) {
  return <group name={`component-${id}`} onClick={(e) => { e.stopPropagation(); if (e.delta <= 3) onSelect(id) }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
    {children}{selected === id && <SelectionBrackets id={id} />}
  </group>
}

function SelectionBrackets({ id }: { id: ComponentId }) {
  const frames: Record<ComponentId, { center: [number, number, number]; half: [number, number] }> = {
    monitor: { center: [-9, .8, .1], half: [3.8, 2.4] },
    cpu: { center: [PUMP_MOUNT[0], PUMP_MOUNT[1], PUMP_MOUNT[2] + .3], half: [.65, .65] },
    ram: { center: [RAM_MOUNT[0] + .34, RAM_MOUNT[1], -2.45], half: [.52, 1.35] },
    ssd: { center: [SSD_MOUNT[0], SSD_MOUNT[1], -2.7], half: [1, .3] },
    motherboard: { center: [BOARD_POSITION[0], BOARD_POSITION[1], -2.98], half: [2.22, 2.77] },
    gpu: { center: [GPU_MOUNT[0], .25, -.92], half: [3.22, .85] },
    psu: { center: [PSU_MOUNT[0], PSU_MOUNT[1], 1.73], half: [2.35, .85] },
    cooling: { center: [0, 3.45, .15], half: [3.1, 1.7] },
    case: { center: [0, 1.2, 3.63], half: [3.85, 3.85] },
  }
  const { center, half } = frames[id]
  return <group name="selection-markers" position={center}>
    {[-1, 1].flatMap(sx => [-1, 1].map(sy => <group key={`${sx}:${sy}`} position={[sx * half[0], sy * half[1], 0]}>
      <mesh position={[-sx * .08, 0, 0]}><boxGeometry args={[.18, .018, .012]} /><meshBasicMaterial color={colors.rgb} /></mesh>
      <mesh position={[0, -sy * .08, 0]}><boxGeometry args={[.018, .18, .012]} /><meshBasicMaterial color={colors.rgb} /></mesh>
    </group>))}
  </group>
}
function StudioFloor() { return <group><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.08, 0]} receiveShadow><planeGeometry args={[42, 42]} /><meshStandardMaterial color="#10212a" metalness={.42} roughness={.72} /></mesh><gridHelper args={[28, 28, '#2c647a', '#173948']} position={[0, -3.07, 0]} /></group> }

function Case({ internal, fanRpm, powered }: { internal: boolean; fanRpm: number; powered: boolean }) {
  return <group userData={{ cameraObstacle: true }}>
    <RoundedBox args={[CASE_GEOMETRY.width, .34, CASE_GEOMETRY.depth]} radius={.1} smoothness={4} position={[0, 5.25, CASE_GEOMETRY.centerZ]} castShadow><meshStandardMaterial color={colors.steel} metalness={.9} roughness={.28} /></RoundedBox>
    <RoundedBox args={[CASE_GEOMETRY.width, .34, CASE_GEOMETRY.depth]} radius={.1} smoothness={4} position={[0, -2.8, CASE_GEOMETRY.centerZ]} castShadow><meshStandardMaterial color="#293a42" metalness={.88} roughness={.32} /></RoundedBox>
    {[-3.7, 3.7].map(x => <RoundedBox key={x} args={[.3, 7.8, .3]} radius={.09} smoothness={4} position={[x, 1.2, CASE_GEOMETRY.frontPostZ]}><meshStandardMaterial color={colors.steel} metalness={.9} roughness={.25} /></RoundedBox>)}
    {[-3.7, 3.7].map(x => <RoundedBox key={`b${x}`} args={[.3, 7.8, .3]} radius={.09} smoothness={4} position={[x, 1.2, -3.45]}><meshStandardMaterial color={colors.steel} metalness={.9} roughness={.25} /></RoundedBox>)}
    <RoundedBox args={[.35, 7.65, CASE_GEOMETRY.sideWallDepth]} radius={.08} smoothness={4} position={[-3.8, 1.2, CASE_GEOMETRY.centerZ]}><meshStandardMaterial color="#263840" metalness={.92} roughness={.26} /></RoundedBox>
    <group position={[3.8, 1.2, CASE_GEOMETRY.centerZ]}>{Array.from({ length: 28 }, (_, i) => <mesh key={i} position={[0, -3.45 + i * .255, 0]}><boxGeometry args={[.14, .09, CASE_GEOMETRY.grilleDepth]} /><meshStandardMaterial color="#344952" metalness={.82} roughness={.34} /></mesh>)}</group>
    <GlassPanel internal={internal} />
    {FRONT_FAN_Y.map(y => <Fan key={y} position={[3.42, y, CASE_GEOMETRY.centerZ]} rotation={[0, -Math.PI / 2, 0]} size={1.28} rpm={fanRpm} accent={powered ? '#83dcff' : '#17252b'} />)}
    <mesh position={[0, 1.15, -3.47]}><boxGeometry args={[6.95, 7.6, .12]} /><meshStandardMaterial color="#203039" metalness={.85} roughness={.38} /></mesh>
    <group position={[0, -2.96, 0]}>{[-3.2, 3.2].flatMap(x => [-2.7, .69].map(z => <RoundedBox key={`${x}${z}`} args={[.54, .48, .54]} radius={.08} position={[x, -.28, z]}><meshStandardMaterial color="#101619" roughness={.72} /></RoundedBox>))}</group>
  </group>
}

function GlassPanel({ internal }: { internal: boolean }) {
  if (internal) return null
  return <group name="glass-panel" position={[0, 1.25, CASE_GEOMETRY.glassZ]}><mesh><boxGeometry args={[7.05, 7.72, .055]} /><meshPhysicalMaterial color="#1d3a48" metalness={.15} roughness={.05} transmission={.72} thickness={.15} transparent opacity={.36} /></mesh><group position={[0, 0, .05]}>{[-3.14, 3.14].map(x => <mesh key={x} position={[x, 0, 0]}><boxGeometry args={[.08, 7.48, .05]} /><meshStandardMaterial color="#26353a" metalness={.9} roughness={.22} /></mesh>)}</group></group>
}

function ChassisDetails({ internal }: { internal: boolean }) { return <group>
  <group position={[3.56, 4.78, .14]} rotation={[0, Math.PI / 2, 0]}><mesh><cylinderGeometry args={[.16, .16, .1, 32]} /><meshStandardMaterial color="#10171b" metalness={.8} /></mesh><mesh position={[0, .056, 0]}><cylinderGeometry args={[.07, .07, .012, 32]} /><meshStandardMaterial color="#78d7f2" emissive="#207994" emissiveIntensity={2} /></mesh></group>
  {[.54, .14].map(z => <group key={z} position={[3.57, 4.38, z]} rotation={[0, Math.PI / 2, 0]}><RoundedBox args={[.08, .14, .42]} radius={.035}><meshStandardMaterial color="#050708" metalness={.8} /></RoundedBox></group>)}
  <group position={[-3.88, -.1, -2.8]}>{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, -2.5 + i * .72, 0]}><boxGeometry args={[.08, .38, 1.1]} /><meshStandardMaterial color="#2b383e" metalness={.9} /></mesh>)}</group>
  <RoundedBox userData={{ cameraObstacle: true }} args={[6.85, .12, CASE_GEOMETRY.shroudDepth]} radius={.04} smoothness={3} position={[0, -1.13, CASE_GEOMETRY.shroudCenterZ]}><meshStandardMaterial color="#22323a" metalness={.86} roughness={.3} /></RoundedBox>
  {!internal && <RoundedBox args={[6.85, 1.5, .1]} radius={.04} position={[0, -1.98, CASE_GEOMETRY.frontFaceZ]}><meshStandardMaterial color="#22323a" metalness={.86} roughness={.3} /></RoundedBox>}
 </group> }

function Screw({ position, size = .12 }: { position: [number, number, number]; size?: number }) { return <group position={position} rotation={[Math.PI / 2, 0, 0]}><mesh><cylinderGeometry args={[size, size, .06, 16]} /><meshStandardMaterial color="#8a9699" metalness={1} roughness={.28} /></mesh><mesh position={[0, 0, .035]}><boxGeometry args={[size * 1.1, .025, .008]} /><meshStandardMaterial color="#283438" /></mesh></group> }

function Motherboard() {
  const smallParts = useMemo(() => Array.from({ length: 64 }, (_, i) => ({ x: -2.55 + (i % 8) * .45 + (i % 2) * .08, y: -2.45 + Math.floor(i / 8) * .47, s: i % 3 === 0 ? .15 : .09 })), [])
  const traces = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: -2.8 + (i % 6) * .78, y: -2.5 + Math.floor(i / 6) * 1.4 })), [])
  // All socket and daughterboard mounting locations share this ATX transform.
  return <group name="atx-board" position={BOARD_POSITION} scale={BOARD_SCALE}>
    <RoundedBox args={[6.55, 7.55, .16]} radius={.11} smoothness={4} castShadow><meshStandardMaterial color={colors.pcb} metalness={.18} roughness={.55} /></RoundedBox>
    <mesh position={[0, 0, .095]}><planeGeometry args={[6.25, 7.25]} /><meshStandardMaterial color="#16332d" roughness={.7} metalness={.1} /></mesh>
    {traces.map((p, i) => <group key={i} position={[p.x, p.y, .115]}><mesh><boxGeometry args={[.52, .018, .018]} /><meshBasicMaterial color={colors.trace} transparent opacity={.6} /></mesh><mesh position={[.25, .13, 0]}><boxGeometry args={[.018, .27, .018]} /><meshBasicMaterial color={colors.trace} transparent opacity={.45} /></mesh></group>)}
    {[-2.8, 2.8].flatMap(x => [-3.25, 0, 3.25].map(y => <Screw key={`${x}:${y}`} position={[x, y, .17]} size={.11} />))}
    <Socket position={[-.8, 1.45, .19]} />
    <VRM position={[-.8, 2.63, .19]} count={8} horizontal /><VRM position={[-2.5, 1.45, .19]} count={6} />
    <DIMMSlots /><PCIeSlots /><M2Slots />
    <group position={[-2.35, -1.15, .19]}>{smallParts.map((p, i) => <group key={i} position={[p.x + 2.2, p.y + 1.25, 0]}><mesh><boxGeometry args={[p.s * 1.6, p.s, .07]} /><meshStandardMaterial color={i % 4 === 0 ? '#51646a' : '#171e20'} metalness={.45} roughness={.42} /></mesh>{i % 5 === 0 && <mesh position={[.12, 0, .05]}><cylinderGeometry args={[.045, .045, .08, 12]} /><meshStandardMaterial color="#a7a5a0" metalness={.8} /></mesh>}</group>)}</group>
    <Chipset position={[1.85, -1.75, .23]} /><ATXConnector /><SATA /><RearIO /><EPSConnector />
  </group>
}
function MotherboardHotspots() {
  const points: readonly {name:string;position:[number,number,number];color:string}[]=[
    {name:'CPU socket',position:[-.8,1.45,.48],color:'#72d5ff'},
    {name:'chipset',position:[1.85,-1.75,.5],color:'#46ddbb'},
    {name:'DIMM slots',position:[1.8,1.2,.52],color:'#59e9c1'},
    {name:'PCIe expansion slots',position:[.55,-.9,.52],color:'#a894ff'},
    {name:'M.2 slots',position:[-.25,-2.4,.52],color:'#50b7ff'},
    {name:'rear I/O',position:[-3.22,1.35,.52],color:'#72d5ff'},
    {name:'24-pin ATX power',position:[3,.4,.52],color:'#ffd27a'},
    {name:'8-pin CPU power',position:[-2.3,3.3,.52],color:'#ffd27a'},
  ]
  return <group name="motherboard-connection-highlights" position={BOARD_POSITION} scale={BOARD_SCALE}>{points.map(point=><group name={point.name} position={point.position} key={point.name}><mesh><ringGeometry args={[.13,.18,24]}/><meshBasicMaterial color={point.color} transparent opacity={.88} side={THREE.DoubleSide}/></mesh><pointLight color={point.color} intensity={.8} distance={.7}/></group>)}</group>
}
function Socket({ position }: { position: [number, number, number] }) { return <group name="cpu-socket" position={position}><RoundedBox args={[1.7, 1.7, .12]} radius={.08} smoothness={3}><meshStandardMaterial color="#1c2528" metalness={.85} roughness={.3} /></RoundedBox><mesh position={[0, 0, .09]}><boxGeometry args={[1.38, 1.38, .05]} /><meshStandardMaterial color="#bcc8c6" metalness={.9} roughness={.2} /></mesh><mesh position={[-.72, 0, .15]}><torusGeometry args={[.64, .026, 8, 28, Math.PI]} /><meshStandardMaterial color={colors.aluminum} metalness={1} /></mesh>{[-.62, .62].map(x => <Screw key={x} position={[x, -.65, .15]} size={.07} />)}</group> }
function VRM({ position, count, horizontal = false }: { position: [number, number, number]; count: number; horizontal?: boolean }) { return <group position={position}>{Array.from({ length: count }, (_, i) => <group key={i} position={horizontal ? [-1.25 + i * .36, 0, 0] : [0, -.85 + i * .34, 0]}><mesh><boxGeometry args={horizontal ? [.22, .36, .13] : [.42, .2, .13]} /><meshStandardMaterial color="#303b3f" metalness={.85} roughness={.35} /></mesh><mesh position={[0, 0, .09]}><boxGeometry args={horizontal ? [.1, .22, .05] : [.24, .09, .05]} /><meshStandardMaterial color="#717f7f" metalness={.7} /></mesh></group>)}<RoundedBox args={horizontal ? [3.1, .42, .15] : [.45, 2.15, .15]} radius={.04} position={horizontal ? [0, .34, .02] : [.35, 0, .02]}><meshStandardMaterial color="#516166" metalness={.92} roughness={.28} /></RoundedBox></group> }
function DIMMSlots() { return <group name="dimm-slots" position={[1.3, 1.2, .2]}>{Array.from({ length: 4 }, (_, i) => <group key={i} position={[i * .34, 0, 0]}><mesh><boxGeometry args={[.13, 3.35, .15]} /><meshStandardMaterial color="#101518" metalness={.7} roughness={.36} /></mesh><mesh position={[0, 0, .09]}><boxGeometry args={[.035, 2.9, .03]} /><meshStandardMaterial color="#d3b86b" metalness={.8} /></mesh><mesh position={[0, 1.7, .04]}><boxGeometry args={[.22, .15, .11]} /><meshStandardMaterial color="#6b7779" /></mesh></group>)}</group> }
function PCIeSlots() { return <group name="pcie-expansion-slots" position={[.55, -.9, .2]}>{[0, -.7, -1.4].map((y, i) => <group key={y} position={[0, y, 0]}><mesh><boxGeometry args={[4.35 - i * 1.35, .2, .17]} /><meshStandardMaterial color="#12191b" metalness={.65} /></mesh><mesh position={[-1.4, .01, .1]}><boxGeometry args={[1.2, .035, .035]} /><meshStandardMaterial color="#d1ae5f" metalness={.8} /></mesh></group>)}</group> }
function M2Slots() { return <group name="m2-slots">{[[-.25, -.25], [-.25, -2.4]].map(([x, y]) => <group key={y} position={[x, y, .22]}><RoundedBox args={[1.65, .48, .09]} radius={.04}><meshStandardMaterial color="#536468" metalness={.9} roughness={.25} /></RoundedBox><mesh position={[.52, 0, .06]}><boxGeometry args={[.5, .06, .025]} /><meshStandardMaterial color="#8b9b9c" /></mesh><Screw position={[.68, 0, .08]} size={.055} /></group>)}</group> }
function Chipset({ position }: { position: [number, number, number] }) { return <group name="chipset" position={position}><RoundedBox args={[1.25, 1.25, .18]} radius={.12} smoothness={4}><meshStandardMaterial color="#36464a" metalness={.94} roughness={.28} /></RoundedBox>{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, -.42 + i * .12, .1]}><boxGeometry args={[1.0, .025, .04]} /><meshStandardMaterial color="#9ba4a3" metalness={1} /></mesh>)}</group> }
function ATXConnector() { return <group name="atx-24-pin-power" position={[3.0, .4, .25]}>{Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[0, -.7 + i * .125, 0]}><boxGeometry args={[.26, .08, .14]} /><meshStandardMaterial color="#202a2c" /></mesh>)}</group> }
function SATA() { return <group position={[2.95, -2.25, .23]} rotation={[0, 0, Math.PI / 2]}>{Array.from({ length: 4 }, (_, i) => <RoundedBox key={i} args={[.4, .24, .16]} radius={.04} position={[i * .32, 0, 0]}><meshStandardMaterial color="#172225" /></RoundedBox>)}</group> }
function RearIO() { return <group name="rear-io" position={[-3.22, 1.35, .24]}>{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[0, -2.1 + i * .55, 0]}><boxGeometry args={[.14, .34, .14]} /><meshStandardMaterial color={i % 3 === 0 ? '#8ab8c7' : '#263236'} metalness={.8} /></mesh>)}</group> }
function EPSConnector() { return <group name="cpu-eps-power" position={[-2.3, 3.3, .24]}>{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-.25 + (i % 2) * .25, -.35 + Math.floor(i / 2) * .23, 0]}><boxGeometry args={[.2, .18, .13]} /><meshStandardMaterial color="#161e21" /></mesh>)}</group> }

function CPU({ detail }: { detail: boolean }) { return <group position={CPU_MOUNT} scale={[.64, .64, 1]}><RoundedBox args={[1.43, 1.43, .16]} radius={.07} smoothness={3} position={[0, 0, detail ? .72 : .02]}><meshStandardMaterial color="#c5d0ce" metalness={.94} roughness={.23} /></RoundedBox><mesh position={[0, 0, -.1]}><boxGeometry args={[1.66, 1.66, .06]} /><meshStandardMaterial color="#395b50" metalness={.52} /></mesh>{detail && <CPUTechnical />}</group> }
function CPUTechnical() { return <group position={[0, 0, 1.25]}>{[-.35, .35].flatMap(x => [-.35, .35].map(y => <RoundedBox key={`${x}${y}`} args={[.55, .55, .15]} radius={.04} position={[x, y, 0]}><meshPhysicalMaterial color="#43c5e8" emissive="#11627d" emissiveIntensity={1.2} transparent opacity={.76} /></RoundedBox>))}<mesh position={[0, -.7, 0]}><boxGeometry args={[1.4, .16, .1]} /><meshBasicMaterial color={colors.violet} /></mesh><mesh position={[0, .7, 0]}><boxGeometry args={[1.4, .12, .1]} /><meshBasicMaterial color={colors.rgb} /></mesh></group> }

function Memory() { return <group position={RAM_MOUNT} scale={[BOARD_SCALE[0], BOARD_SCALE[1], 1]}>{[0, .34, .68, 1.02].map((x, i) => <group key={i} position={[x, 0, 0]}><RoundedBox args={[.18, 3.25, .58]} radius={.035} smoothness={3}><meshStandardMaterial color="#1d3935" metalness={.45} roughness={.5} /></RoundedBox>{[-1.05, -.35, .35, 1.05].map(y => <mesh key={y} position={[0, y, .32]}><boxGeometry args={[.2, .48, .06]} /><meshStandardMaterial color="#171d1f" roughness={.45} /></mesh>)}<mesh position={[0, 1.68, .05]}><RoundedBox args={[.28, .12, .28]} radius={.035}><meshStandardMaterial color="#82e4da" emissive="#126d62" emissiveIntensity={1.2} /></RoundedBox></mesh>{Array.from({ length: 10 }, (_, n) => <mesh key={n} position={[0, -1.62 + n * .09, -.1]}><boxGeometry args={[.16, .035, .025]} /><meshStandardMaterial color={colors.gold} metalness={.85} /></mesh>)}</group>)}</group> }

function NVMe() { return <group position={SSD_MOUNT} scale={.64} rotation={[0, 0, Math.PI / 2]}><RoundedBox args={[.68, 2.85, .09]} radius={.03} smoothness={3}><meshStandardMaterial color="#123a32" roughness={.48} metalness={.28} /></RoundedBox>{[-.75, -.05, .72].map((y, i) => <mesh key={y} position={[0, y, .08]}><boxGeometry args={[.54, i === 1 ? .42 : .56, .06]} /><meshStandardMaterial color={i === 1 ? '#263136' : '#111719'} /></mesh>)}{Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[-.27 + i * .075, -1.38, .06]}><boxGeometry args={[.04, .15, .02]} /><meshStandardMaterial color={colors.gold} metalness={.9} /></mesh>)}<Screw position={[0, 1.3, .1]} size={.06} /></group> }

function GraphicsCard({ exploded, load, fanRpm }: { exploded: boolean; load: number; fanRpm: number }) {
  const z = exploded ? .8 : .34, fin = exploded ? -.65 : -.1
  return <group name="gpu-assembly" position={GPU_MOUNT} rotation={[Math.PI / 2, 0, 0]}>
    <mesh position={[boardPoint(.55, -.9, .2)[0] - GPU_MOUNT[0], -1.04, -.58]}><boxGeometry args={[2.75, .3, .075]} /><meshStandardMaterial color={colors.gold} metalness={.8} /></mesh>
    <group position={[0, 0, fin]}>{Array.from({ length: 38 }, (_, i) => <mesh key={i} position={[-2.75 + i * .148, 0, 0]}><boxGeometry args={[.032, 1.35, .88]} /><meshStandardMaterial color="#a4afb0" metalness={1} roughness={.27} /></mesh>)}<group position={[0, 0, .22]}><MemoHeatpipes /></group></group>
    <group position={[0, 0, z]}><RoundedBox args={[6.25, 1.75, .8]} radius={.17} smoothness={5}><meshStandardMaterial color="#172126" metalness={.92} roughness={.26} /></RoundedBox><mesh position={[0, -.69, .27]}><boxGeometry args={[5.75, .16, .36]} /><meshStandardMaterial color="#334247" metalness={.84} roughness={.3} /></mesh>{[-1.9, 0, 1.9].map((x, i) => <Fan key={i} position={[x, 0, .54]} size={.8} scaleX={1 / CASE_WIDTH_SCALE} load={load} rpm={fanRpm} accent={i === 1 ? colors.violet : colors.rgb} />)}{Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-2.55 + i * .85, .72, .45]}><boxGeometry args={[.48, .06, .07]} /><meshStandardMaterial color="#5a6a6f" metalness={1} /></mesh>)}</group>
    <group position={[0, 0, exploded ? -1.25 : -.58]}><RoundedBox args={[6.02, 1.48, .13]} radius={.04} smoothness={3}><meshStandardMaterial color="#16342e" metalness={.35} roughness={.48} /></RoundedBox><mesh position={[0, 0, .1]}><boxGeometry args={[1.18, 1.1, .08]} /><meshStandardMaterial color="#2b8094" emissive="#154857" emissiveIntensity={1.1} /></mesh>{[-1.7,-.85,.85,1.7].map(x=><mesh key={x} position={[x,.15,.1]}><boxGeometry args={[.6,.68,.06]} /><meshStandardMaterial color="#29275b" metalness={.3} /></mesh>)}<group position={[2.65,.48,.1]}>{Array.from({length:12},(_,i)=><mesh key={i} position={[-.25+(i%2)*.22,-.28+Math.floor(i/2)*.11,0]}><boxGeometry args={[.18,.08,.09]}/><meshStandardMaterial color="#151d20"/></mesh>)}</group></group>
    <mesh position={[-3.15, 0, .02]}><boxGeometry args={[.1, 1.65, .85]} /><meshStandardMaterial color="#9aa6a8" metalness={1} roughness={.25} /></mesh><mesh position={[-3.25, -.6, -.05]}><boxGeometry args={[.1, .55, 1.25]} /><meshStandardMaterial color="#8a989b" metalness={1} /></mesh>
    <group position={[2.45, .73, .25]}>{[0,.32].map(x=><RoundedBox key={x} args={[.22,.22,.45]} radius={.035} position={[x,0,0]}><meshStandardMaterial color="#141b1e" /></RoundedBox>)}</group>
    {[-2.75,2.75].map(x=><Screw key={x} position={[x,.63,z+.48]} size={.07}/>)}</group>
}
function Heatpipes(){return <group>{[-.34,0,.34].map((y,i)=>{const c=new THREE.CatmullRomCurve3([v(-2.6,y,-.28),v(-.7,y-.18,-.5),v(.7,y+.18,-.5),v(2.65,y,-.28)]);return <mesh key={i}><tubeGeometry args={[c,36,.06,8,false]}/><meshStandardMaterial color={colors.copper} metalness={1} roughness={.22}/></mesh>})}</group>}

function PowerSupply({ load, fanRpm }: { load: number; fanRpm: number }) { return <group position={PSU_MOUNT}><RoundedBox args={[4.55,1.65,3.15]} radius={.12} smoothness={4}><meshStandardMaterial color="#151d21" metalness={.88} roughness={.34}/></RoundedBox><group position={[-1.15,0,1.6]}>{[.42,.58,.74].map(radius=><mesh key={radius} position={[0,0,.38]}><torusGeometry args={[radius,.016,6,40]}/><meshStandardMaterial color="#556367" metalness={1}/></mesh>)}<Fan position={[0,0,.12]} size={.81} scaleX={1 / CASE_WIDTH_SCALE} load={load} rpm={fanRpm} accent="#e0b85f"/></group><group position={[1.35,0,1.59]}>{Array.from({length:3},(_,i)=><RoundedBox key={i} args={[.52,.36,.08]} radius={.03} position={[0,-.45+i*.45,0]}><meshStandardMaterial color="#28353a"/></RoundedBox>)}</group>{[[-1.9,-.62],[1.9,-.62],[-1.9,.62],[1.9,.62]].map(([x,y])=><Screw key={`${x}${y}`} position={[x,y,1.61]} size={.06}/>)}</group> }

function Cable({ points, power = false, radius = .075 }: { points: THREE.Vector3[]; power?: boolean; radius?: number }) { const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]); return <mesh><tubeGeometry args={[curve, 48, radius, 10, false]} /><meshStandardMaterial color={power ? '#916b2e' : '#101719'} emissive={power ? '#3e2805' : '#000000'} emissiveIntensity={power ? .9 : 0} roughness={.62} /></mesh> }
function CableHarness({ power }: { power: boolean }) {
  return <group>
    <Cable power={power} radius={.11} points={[v(.15,-2.05,1.48),v(2.8,-1.5,.78),v(2.65,1.5,-2),new THREE.Vector3(...boardPoint(3,.4,.35))]}/>
    <Cable power={power} radius={.085} points={[v(.15,-2.5,1.48),v(-3.35,-1.5,1),v(-3.3,3.8,-2.7),new THREE.Vector3(...boardPoint(-2.3,3.3,.35))]}/>
    <Cable power={power} radius={.1} points={[v(.15,-1.6,1.48),v(2.9,-1.6,1.48),v(3.15,.1,-.7),v(1.8,GPU_MOUNT[1]-.25,-1.22)]}/>
    <Cable radius={.035} points={[v(-.85,2.7,-2.6),v(-2.15,3.25,-2.8),new THREE.Vector3(...boardPoint(-2.3,3.3,.3))]}/>
  </group>
}

function MovingPulse({ points, color, count = 3, reverse = false, speed = .16, size = .065 }: { points: THREE.Vector3[]; color: string; count?: number; reverse?: boolean; speed?: number; size?: number }) { const nodes = useRef<THREE.Mesh[]>([]); const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]); useFrame(({ clock }) => nodes.current.forEach((node, i) => { if (node) { const t=(clock.getElapsedTime()*speed+i/count)%1; node.position.copy(curve.getPointAt(reverse?1-t:t)) } })); return <group><mesh><tubeGeometry args={[curve,30,.012,5,false]}/><meshBasicMaterial color={color} transparent opacity={.25}/></mesh>{Array.from({length:count},(_,i)=><mesh key={i} ref={n=>{if(n)nodes.current[i]=n}}><sphereGeometry args={[size,10,10]}/><meshBasicMaterial color={color}/></mesh>)}</group> }
function DataPaths(){return <group name="data-flow">
  <MovingPulse color={colors.rgb} points={[new THREE.Vector3(...CPU_MOUNT),v(-.3,2.7,-2.5),new THREE.Vector3(...RAM_MOUNT)]}/>
  <MovingPulse color={colors.violet} points={[new THREE.Vector3(...CPU_MOUNT),v(-1.4,1.3,-2.7),v(-.1,.6,-2.8)]}/>
  <MovingPulse color="#55e4b8" points={[new THREE.Vector3(...CPU_MOUNT),v(-1.7,1.9,-2.8),new THREE.Vector3(...SSD_MOUNT)]}/>
</group>}
const CPU_POINT = new THREE.Vector3(...CPU_MOUNT), RAM_POINT = new THREE.Vector3(...RAM_MOUNT), SSD_POINT = new THREE.Vector3(...SSD_MOUNT)
const CHIPSET_POINT = new THREE.Vector3(...boardPoint(1.85,-1.75,.42)), GPU_POINT = v(-.1,.6,-2.7), PSU_POINT = v(.15,-2.05,1.48)
const AC_PSU_ROUTE=[v(-1.2,-2.05,2.58),v(-1.2,-2.05,1.78),PSU_POINT]
const ATX_ROUTE=[PSU_POINT,v(2.8,-1.5,.78),v(2.65,1.5,-2),new THREE.Vector3(...boardPoint(3,.4,.35))]
const EPS_ROUTE=[PSU_POINT,v(-3.35,-1.5,1),v(-3.3,3.8,-2.7),new THREE.Vector3(...boardPoint(-2.3,3.3,.35)),CPU_POINT]
const GPU_POWER_ROUTE=[PSU_POINT,v(2.9,-1.6,1.8),v(3.15,.1,-.7),v(1.8,GPU_MOUNT[1]-.25,-1.22)]
const CPU_RAM_ROUTE=[CPU_POINT,v(-.3,2.7,-2.5),RAM_POINT], CPU_GPU_ROUTE=[CPU_POINT,v(-1.4,1.3,-2.7),GPU_POINT]
// The internal graphics path ends at the port; Monitor owns the external cable pulse.
const GPU_OUTPUT_ROUTE=[GPU_POINT,v(-2.8,GPU_MOUNT[1],-1.95),GPU_DISPLAY_OUTPUT]
const IO_POINT=v(-3.35,2.15,-3.05), NETWORK_POINT=v(-3.35,.85,-3.05), INPUT_POINT=v(-4.8,2.15,-2.5), NETWORK_EDGE=v(-4.8,.85,-2.5)
const INPUT_ROUTE=[INPUT_POINT,IO_POINT,CHIPSET_POINT,RAM_POINT,CPU_POINT], NETWORK_ROUTE=[NETWORK_EDGE,NETWORK_POINT,CHIPSET_POINT,RAM_POINT,CPU_POINT]
const SSD_CHIPSET_ROUTE=[CHIPSET_POINT,SSD_POINT], CHIPSET_RAM_ROUTE=[CHIPSET_POINT,v(-.2,.9,-2.65),RAM_POINT]
const DIRECT_CHIPSET_RAM_ROUTE=[CHIPSET_POINT,RAM_POINT], DIRECT_CPU_RAM_ROUTE=[CPU_POINT,RAM_POINT]
const SHUTDOWN_ROUTE=[RAM_POINT,CHIPSET_POINT,SSD_POINT]
const AIRFLOW_ROUTES=FRONT_FAN_Y.map(y=>[v(4.7,y,-1.005),v(3.42,y,-1.005),v(1.1,y,-1.1),v(-1.2,y,-1.6)])
const CPU_EXHAUST_ROUTE=[CPU_POINT,v(-.4,3.5,-1.8),v(0,4.8,-.9),v(0,6.2,-.9)]
const GPU_EXHAUST_ROUTE=[GPU_POINT,v(.4,2.5,-1.2),v(1.4,4.8,-.8),v(1.4,6.2,-.8)]
const HOT_COOLANT_ROUTE=[CPU_POINT,v(.2,3.25,-1.5),v(2.65,4.5,-1.25)], COLD_COOLANT_ROUTE=[CPU_POINT,v(.4,3.05,-.9),v(2.65,4.5,-.6)]

function ProcessVisualization({phase,progress,mode,dataEnabled,powerEnabled,cpuTemp,gpuTemp,fanRpm}:{phase:SystemPhase;progress:number;mode:ExecutionMode;dataEnabled:boolean;powerEnabled:boolean;cpuTemp:number;gpuTemp:number;fanRpm:number}) {
  if(phase==='poweredOff') return <group name="standby-power"><mesh position={boardPoint(3,.4,.44)}><sphereGeometry args={[.045,8,8]}/><meshBasicMaterial color="#8c6724" transparent opacity={.38}/></mesh></group>
  const running=phase==='running', shutting=phase==='shuttingDown'
  const showPower=powerEnabled || ['powerButton','psuStarting','resetRelease','uefiStart','gpuInitialization'].includes(phase) || (running&&mode==='POWER')
  const showData=dataEnabled && (running || ['resetRelease','uefiStart','post','memoryInitialization','gpuInitialization','storageDetection','bootDeviceSelection','bootloader','osLoading','driverInitialization','systemInitialization','shuttingDown'].includes(phase)) && (!running || (mode!=='POWER' && mode!=='COOLING'))
  const thermal=running&&mode==='COOLING'
  return <group name="process-visualization" userData={{phase,mode}}>
    {showPower&&<group name="power-flow">
      {phase==='powerButton'?<MovingPulse color="#ffca64" points={ATX_ROUTE} count={2}/>:phase==='psuStarting'?<><MovingPulse color="#ffb34d" points={AC_PSU_ROUTE} count={4}/><MovingPulse color="#ffc45c" points={ATX_ROUTE}/><MovingPulse color="#ffc45c" points={EPS_ROUTE}/><MovingPulse color="#ffc45c" points={GPU_POWER_ROUTE}/></>:<><MovingPulse color="#ffc45c" points={ATX_ROUTE}/><MovingPulse color="#ffc45c" points={EPS_ROUTE}/><MovingPulse color="#ffc45c" points={GPU_POWER_ROUTE}/></>}
    </group>}
    {showData&&<group name="data-flow">
      {phase==='post'?<><MovingPulse color="#50e3a4" points={CPU_RAM_ROUTE} count={2}/><MovingPulse color="#a78bfa" points={CPU_GPU_ROUTE} count={2}/><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE} count={2}/></>:null}
      {phase==='memoryInitialization'||(running&&mode==='MEMORY')?<><MovingPulse color="#50e3a4" points={CPU_RAM_ROUTE}/><MovingPulse reverse color="#50e3a4" points={CPU_RAM_ROUTE}/></>:null}
      {phase==='gpuInitialization'||(running&&['GRAPHICS','CPU TASK'].includes(mode))?<MovingPulse color="#a78bfa" points={CPU_GPU_ROUTE} count={4}/>:null}
      {phase==='storageDetection'?<MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE} count={4}/>:null}
      {phase==='bootDeviceSelection'?<><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE} count={3}/><MovingPulse color="#50e3a4" points={DIRECT_CHIPSET_RAM_ROUTE} count={2}/></>:null}
      {phase==='bootloader'?<><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE} count={4}/><MovingPulse color="#50e3a4" points={CHIPSET_RAM_ROUTE} count={4}/><MovingPulse color="#32d7cf" points={DIRECT_CPU_RAM_ROUTE}/></>:null}
      {phase==='osLoading'?<><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE} count={4}/><MovingPulse color="#50e3a4" points={CHIPSET_RAM_ROUTE}/><MovingPulse reverse color="#32d7cf" points={CPU_RAM_ROUTE}/></>:null}
      {phase==='driverInitialization'?<><MovingPulse color="#32d7cf" points={INPUT_ROUTE}/><MovingPulse color="#62b8ff" points={NETWORK_ROUTE}/><MovingPulse color="#a78bfa" points={CPU_GPU_ROUTE}/><MovingPulse color="#70bfff" points={SSD_CHIPSET_ROUTE}/></>:null}
      {phase==='systemInitialization'?<><MovingPulse color="#32d7cf" points={DIRECT_CPU_RAM_ROUTE}/><MovingPulse color="#62b8ff" points={NETWORK_ROUTE}/><MovingPulse color="#a78bfa" points={GPU_OUTPUT_ROUTE}/></>:null}
      {running&&mode==='STORAGE'?<><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE}/><MovingPulse color="#50e3a4" points={DIRECT_CHIPSET_RAM_ROUTE}/><MovingPulse color="#70bfff" points={SSD_CHIPSET_ROUTE}/></>:null}
      {running&&mode==='OVERVIEW'?<><MemoDataPaths/></>:null}
      {running&&mode==='CPU TASK'?<><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE}/><MovingPulse reverse color="#32d7cf" points={DIRECT_CPU_RAM_ROUTE}/><MovingPulse color="#32d7cf" points={DIRECT_CPU_RAM_ROUTE}/><MovingPulse color="#a78bfa" points={CPU_GPU_ROUTE}/></>:null}
      {running&&mode==='GRAPHICS'?<><MovingPulse color="#a78bfa" points={CPU_GPU_ROUTE}/><MovingPulse color="#a78bfa" points={GPU_OUTPUT_ROUTE} count={3}/></>:null}
      {running&&mode==='I/O'?<><MovingPulse color="#32d7cf" points={INPUT_ROUTE} count={4}/><MovingPulse color="#a78bfa" points={GPU_OUTPUT_ROUTE} count={3}/></>:null}
      {running&&mode==='NETWORK'?<><MovingPulse color="#62b8ff" points={NETWORK_ROUTE} count={4}/><MovingPulse reverse color="#62b8ff" points={NETWORK_ROUTE} count={4}/></>:null}
      {running&&mode==='APPLICATION'?<><MovingPulse reverse color="#70bfff" points={SSD_CHIPSET_ROUTE}/><MovingPulse color="#50e3a4" points={CHIPSET_RAM_ROUTE}/><MovingPulse color="#32d7cf" points={DIRECT_CPU_RAM_ROUTE}/><MovingPulse color="#a78bfa" points={CPU_GPU_ROUTE}/><MovingPulse color="#a78bfa" points={GPU_OUTPUT_ROUTE}/></>:null}
      {shutting?<MovingPulse color="#70bfff" points={SHUTDOWN_ROUTE} count={2} speed={.1} size={Math.max(.012,.065*(1-progress))}/>:null}
    </group>}
    {(thermal||(running&&mode==='COOLING'))&&<ThermalAirflow cpuTemp={cpuTemp} gpuTemp={gpuTemp} fanRpm={fanRpm}/>}
    {!running&&<StageGlow phase={phase} progress={progress}/>}
  </group>
}

const STAGE_GLOWS:Partial<Record<SystemPhase,{p:THREE.Vector3;c:string;s:number}>>={powerButton:{p:v(3.56,4.78,.14),c:'#ffc45c',s:.25},psuStarting:{p:new THREE.Vector3(...PSU_MOUNT),c:'#ffc45c',s:.75},resetRelease:{p:CPU_POINT,c:'#32d7cf',s:.45},uefiStart:{p:new THREE.Vector3(...BOARD_POSITION),c:'#4de0bd',s:.65},post:{p:new THREE.Vector3(...BOARD_POSITION),c:'#4de0bd',s:.8},memoryInitialization:{p:RAM_POINT,c:'#50e3a4',s:.55},gpuInitialization:{p:GPU_POINT,c:'#a78bfa',s:.7},storageDetection:{p:SSD_POINT,c:'#70bfff',s:.38},bootDeviceSelection:{p:SSD_POINT,c:'#70bfff',s:.45},bootloader:{p:RAM_POINT,c:'#50e3a4',s:.55},osLoading:{p:CPU_POINT,c:'#32d7cf',s:.55},driverInitialization:{p:IO_POINT,c:'#62b8ff',s:.7},systemInitialization:{p:new THREE.Vector3(...BOARD_POSITION),c:'#62b8ff',s:.8},shuttingDown:{p:CPU_POINT,c:'#ff8a45',s:.35}}
function StageGlow({phase,progress}:{phase:SystemPhase;progress:number}) { const item=STAGE_GLOWS[phase];if(!item)return null;return <pointLight name="stage-highlight" position={item.p} intensity={5*(phase==='shuttingDown'?1-progress:1)} distance={item.s*5} color={item.c}/> }

function ThermalAirflow({cpuTemp,gpuTemp,fanRpm}:{cpuTemp:number;gpuTemp:number;fanRpm:number}) { const speed=.09+Math.max(0,fanRpm)/9000;const heat=Math.max(0,Math.min(1,(Math.max(cpuTemp,gpuTemp)-35)/50));return <group name="thermal-airflow" userData={{cpuTemp,gpuTemp,fanRpm}}>
  {AIRFLOW_ROUTES.map((route,index)=><MovingPulse key={index} color="#83dcff" points={route} count={3} speed={speed} size={.045}/>) }
  <MovingPulse color="#ff764a" points={CPU_EXHAUST_ROUTE} count={4} speed={speed} size={.05+heat*.035}/>
  <MovingPulse color="#ff9a4d" points={GPU_EXHAUST_ROUTE} count={4} speed={speed} size={.05+heat*.035}/>
  <MovingPulse color="#ff8a45" points={HOT_COOLANT_ROUTE} count={3} speed={speed}/>
  <MovingPulse reverse color="#72dfff" points={COLD_COOLANT_ROUTE} count={3} speed={speed}/>
  <pointLight position={CPU_POINT} intensity={heat*6} distance={2.2} color="#ff633f"/><pointLight position={GPU_POINT} intensity={heat*5} distance={2.8} color="#ff633f"/>
 </group> }

const MemoMotherboard = memo(Motherboard)

const MemoMemory = memo(Memory)

const MemoNVMe = memo(NVMe)

const MemoHeatpipes = memo(Heatpipes)

const MemoCableHarness = memo(CableHarness)

const MemoDataPaths = memo(DataPaths)

const EXECUTION_STORAGE_ROUTE = [SSD_POINT, CHIPSET_POINT, RAM_POINT]
const EXECUTION_READ_ROUTE = [SSD_POINT, CHIPSET_POINT]
function ExecutionVisualization({execution, enabled}:{execution:ExecutionSnapshot;enabled:boolean}) {
  const {state,progress}=execution
  const input=state==='USER_INPUT'
  const storage=state==='STORAGE_READ'||state==='LOAD_TO_RAM'
  const cpu=['OS_REQUEST','PROCESS_CREATION','CPU_EXECUTION','NETWORK_REQUEST','NETWORK_PROCESSING'].includes(state)
  const network=['NETWORK_OUTBOUND','NETWORK_RESPONSE'].includes(state)
  const gpu=state==='GPU_RENDER'||(state==='PAGE_RENDER'&&progress<.6)
  const output=state==='DISPLAY_OUTPUT'||(state==='PAGE_RENDER'&&progress>=.6)
  const highlights = input?[IO_POINT]:storage?[SSD_POINT,...(state==='LOAD_TO_RAM'?[RAM_POINT]:[])]:network?[NETWORK_POINT,RAM_POINT]:cpu?[CPU_POINT,RAM_POINT]:gpu?[GPU_POINT]:output?[GPU_DISPLAY_OUTPUT]:[]
  return <group name="execution-visualization" userData={{state}}>
    {highlights.map((point,index)=><group key={index}><pointLight position={point} intensity={5} distance={3} color="#71e5d3"/><mesh position={point}><sphereGeometry args={[.24,12,8]}/><meshBasicMaterial color="#71e5d3" wireframe transparent opacity={.65}/></mesh></group>)}
    {enabled&&<group name="execution-packets">
      {input&&<MovingPulse points={INPUT_ROUTE} color="#71e5d3"/>}
      {storage&&<MovingPulse points={state==='LOAD_TO_RAM'?EXECUTION_STORAGE_ROUTE:EXECUTION_READ_ROUTE} color="#70bfff"/>}
      {cpu&&<><MovingPulse points={CPU_RAM_ROUTE} color="#71e5d3"/><MovingPulse reverse points={CPU_RAM_ROUTE} color="#71e5d3"/></>}
      {network&&<group name={state==='NETWORK_OUTBOUND'?'network-outbound':'network-inbound'}><MovingPulse points={NETWORK_ROUTE} reverse={state==='NETWORK_OUTBOUND'} color="#62b8ff"/></group>}
      {gpu&&<MovingPulse points={CPU_GPU_ROUTE} color="#a78bfa"/>}
      {output&&<MovingPulse points={GPU_OUTPUT_ROUTE} color="#a78bfa"/>}
    </group>}
  </group>
}
