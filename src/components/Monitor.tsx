import { idleExecution, type ExecutionSnapshot } from '../system/executionMachine'
import { paintExecution } from './executionScreen'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { SystemPhase } from '../system/bootMachine'
import { monitorView } from '../system/monitorState'
import { paintMonitor } from './monitorScreen'
import { CASE_WIDTH_SCALE } from './layout'
import { DISPLAY_ROUTE, DISPLAY_CABLE_RADIUS, GPU_DISPLAY_OUTPUT, MONITOR_POSITION, MONITOR_INPUT, MONITOR_CABLE_INPUT } from './displayLayout'

export function Monitor({ phase, progress, dataFlow, onSelect, execution = idleExecution }: { execution?: ExecutionSnapshot; phase: SystemPhase; progress: number; dataFlow: boolean; onSelect: () => void }) {
  const { state, detail, loading } = monitorView(phase, progress)
  const executionProgress = ['USER_INPUT', 'CPU_EXECUTION', 'NETWORK_REQUEST', 'NETWORK_OUTBOUND', 'NETWORK_RESPONSE', 'NETWORK_PROCESSING', 'PAGE_RENDER'].includes(execution.state) ? Math.floor(execution.progress * 30) / 30 : 0
  const screen = useRef<THREE.Mesh>(null)
  const surface = useRef<{ texture: THREE.CanvasTexture; ctx: CanvasRenderingContext2D } | null>(null)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  useEffect(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false
    surface.current = { texture, ctx }
    const screenMaterial = material.current
    if (screenMaterial) { screenMaterial.map = texture; screenMaterial.needsUpdate = true }
    return () => {
      if (screenMaterial) screenMaterial.map = null
      texture.dispose()
      surface.current = null
    }
  }, [])
  // Static screens ignore telemetry and boot ticks; loading uploads are quantized.
  useEffect(() => {
    if (!surface.current) return
    paintMonitor(surface.current.ctx, state, detail, loading)
    if (state === 'DESKTOP') paintExecution(surface.current.ctx, { state: execution.state, progress: executionProgress })
    surface.current.texture.needsUpdate = true
    if (screen.current) screen.current.userData = { state, loading, executionState: execution.state, redraws: (screen.current.userData.redraws ?? 0) + 1 }
  }, [state, detail, loading, execution.state, executionProgress])
  const curve = useMemo(() => new THREE.CatmullRomCurve3(DISPLAY_ROUTE), [])
  const pulse = useRef<THREE.Mesh>(null)
  const awake = state !== 'OFF'
  useFrame(({ clock }) => { if (pulse.current) curve.getPointAt((clock.elapsedTime * .18) % 1, pulse.current.position) })
  return <group>
    <group name="component-monitor" position={MONITOR_POSITION} scale={[1 / CASE_WIDTH_SCALE, 1, 1]} onClick={e => { e.stopPropagation(); if (e.delta <= 3) onSelect() }}>
      <RoundedBox smoothness={2} name="monitor-bezel" args={[8.22, 4.78, .28]} radius={.09} position={[0, .8, -.1]} castShadow><meshStandardMaterial color="#20282d" roughness={.38} metalness={.3} /></RoundedBox>
      <RoundedBox smoothness={2} name="monitor-housing" args={[6.8, 3.65, .25]} radius={.12} position={[0, .8, -.31]}><meshStandardMaterial color="#171e22" roughness={.65} /></RoundedBox>
      <mesh ref={screen} name="monitor-screen" position={[0, .85, .046]}><planeGeometry args={[8, 4.5]} /><meshBasicMaterial ref={material} color="#ffffff" toneMapped={false} /></mesh>
      <RoundedBox smoothness={2} name="monitor-stand" args={[.55, 2.35, .42]} radius={.08} position={[0, -1.75, -.42]} castShadow><meshStandardMaterial color="#64727c" metalness={.85} roughness={.3} /></RoundedBox>
      <RoundedBox smoothness={2} name="monitor-base" args={[3.2, .18, 1.95]} radius={.08} position={[0, -2.96, -.1]} castShadow><meshStandardMaterial color="#38444c" metalness={.8} roughness={.3} /></RoundedBox>
      <mesh name="monitor-indicator" position={[3.78, -1.51, .049]}><sphereGeometry args={[.027, 12, 8]} /><meshBasicMaterial color={awake ? '#79eddd' : '#ad7836'} toneMapped={false} /></mesh>
      {Array.from({ length: 18 }, (_, i) => <mesh key={i} position={[-2.55 + i * .3, 2.2, -.444]}><boxGeometry args={[.15, .035, .008]} /><meshStandardMaterial color="#070b0d" /></mesh>)}
      <mesh name="monitor-display-input" position={MONITOR_INPUT}><boxGeometry args={[.32, .2, .1]} /><meshStandardMaterial color="#889299" metalness={.9} roughness={.3} /></mesh>
      <mesh name="monitor-display-plug" position={[0, .25, -.64]}><boxGeometry args={[.3, .18, .24]} /><meshStandardMaterial color="#202a30" roughness={.65} /></mesh>
      <mesh name="monitor-strain-relief" position={[0, .25, -.81]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.065, .065, .1, 8]} /><meshStandardMaterial color="#13191d" roughness={.85} /></mesh>
      <group name="monitor-cable-anchor" position={MONITOR_CABLE_INPUT} />
    </group>
    <mesh name="display-cable"><tubeGeometry args={[curve, 64, DISPLAY_CABLE_RADIUS, 6, false]} /><meshStandardMaterial color="#13191d" roughness={.8} /></mesh>
    <mesh name="gpu-display-output" position={GPU_DISPLAY_OUTPUT}><boxGeometry args={[.12, .22, .38]} /><meshStandardMaterial color="#77838b" metalness={.8} roughness={.3} /></mesh>
    <mesh name="gpu-display-plug" position={[-4.235, GPU_DISPLAY_OUTPUT.y, GPU_DISPLAY_OUTPUT.z]}><boxGeometry args={[.36, .18, .3]} /><meshStandardMaterial color="#182126" roughness={.6} /></mesh>
    <mesh name="gpu-strain-relief" position={[-4.47, GPU_DISPLAY_OUTPUT.y, GPU_DISPLAY_OUTPUT.z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.065, .065, .14, 8]} /><meshStandardMaterial color="#13191d" roughness={.85} /></mesh>
    <group name="gpu-cable-anchor" position={DISPLAY_ROUTE[0]} />
    {awake && dataFlow && (execution.state === 'IDLE' || ['DISPLAY_OUTPUT', 'APP_READY', 'PAGE_READY'].includes(execution.state) || (execution.state === 'PAGE_RENDER' && execution.progress >= .6)) && <mesh name="display-output-flow" ref={pulse}><sphereGeometry args={[.085, 12, 8]} /><meshBasicMaterial color="#b6a0ff" toneMapped={false} /></mesh>}
  </group>
}
