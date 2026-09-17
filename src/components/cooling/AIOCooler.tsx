import { useEffect, useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { PUMP_MOUNT } from '../layout'
import { Fan } from './Fan'
import { CASE_WIDTH_SCALE } from '../layout'

function PumpDisplay({ temperature, powered }: { temperature: number; powered: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 192
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    return map
  }, [])
  useEffect(() => {
    const context = texture.image.getContext('2d')!
    context.fillStyle = '#061015'; context.fillRect(0, 0, 256, 192)
    // Three.js textures are mutable GPU resources, not React state.
    // eslint-disable-next-line react/immutability
    if (!powered) { texture.needsUpdate = true; return }
    context.textAlign = 'center'; context.fillStyle = '#8ba9b5'; context.font = '24px monospace'
    context.fillText('CPU', 128, 47)
    context.fillStyle = temperature >= 72 ? '#ffbc86' : '#9de7ff'
    context.font = 'bold 66px monospace'; context.fillText(`${temperature}°C`, 128, 123)
    context.fillStyle = '#547a89'; context.font = '16px monospace'; context.fillText('LIQUID COOLED', 128, 165)
    // Three.js textures are mutable GPU resources, not React state.
    // eslint-disable-next-line react/immutability
    texture.needsUpdate = true
  }, [temperature, powered, texture])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh name="aio-display" userData={{ temperature: powered ? temperature : null, powered }} position={[0, 0, .225]}><planeGeometry args={[.72, .54]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
}

function BraidedTube({ points }: { points: THREE.Vector3[] }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])
  const braid = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#222629'; ctx.fillRect(0, 0, 64, 64)
    ctx.lineWidth = 2
    for (let i = -64; i < 128; i += 8) {
      ctx.strokeStyle = '#606568'; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 64, 64); ctx.stroke()
      ctx.strokeStyle = '#393e42'; ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 64, 64); ctx.stroke()
    }
    const map = new THREE.CanvasTexture(canvas); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(16, 2)
    return map
  }, [])
  useEffect(() => () => braid.dispose(), [braid])
  return <mesh name="braided-coolant-tube"><tubeGeometry args={[curve, 96, .095, 12, false]} /><meshStandardMaterial color="#252b30" roughness={.88} bumpMap={braid} bumpScale={.025} /></mesh>
}

function Fitting({ position, horizontal = false }: { position: [number, number, number]; horizontal?: boolean }) {
  return <group position={position} rotation={horizontal ? [0, 0, Math.PI / 2] : [0, 0, 0]}>
    <mesh><cylinderGeometry args={[.135, .135, .24, 24]} /><meshStandardMaterial color="#65747b" metalness={.95} roughness={.25} /></mesh>
    {[-.075, 0, .075].map(y => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.136, .012, 6, 24]} /><meshStandardMaterial color="#192127" metalness={.7} roughness={.4} /></mesh>)}
  </group>
}

export function AIOCooler({ fanRpm, temperature, powered, exploded }: { fanRpm: number; temperature: number; powered: boolean; exploded: boolean }) {
  const [baseX, y, baseZ] = PUMP_MOUNT
  // Move the pump clear of the exposed CPU layers. The previous diagonal
  // offset left the pump, package and die overlapping in the inspection shot.
  const x = baseX + (exploded ? 1.45 : 0)
  const z = baseZ + (exploded ? 2 : 0)
  const tubes = useMemo(() => [0, 1].map(i => [
    new THREE.Vector3(x + .62, y + .18 - i * .35, z),
    new THREE.Vector3(x + .9 + i * .18, 3.35 - i * .2, z + .45),
    new THREE.Vector3(x + 1.1 + i * .18, 4.02 - i * .12, -1.4 + i * .35),
    new THREE.Vector3(1.8, 4.0 - i * .15, -.85 + i * .65),
    new THREE.Vector3(2.65, 4.5, -1.25 + i * .65),
  ]), [x, y, z])
  return <group name="aio-cooler">
    <group name="pump" position={[x, y, z]}>
      <RoundedBox args={[1.32, .95, .09]} radius={.08} position={[0, 0, -.24]}><meshStandardMaterial color="#7a858a" metalness={.94} roughness={.3} /></RoundedBox>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -.21]}><cylinderGeometry args={[.47, .47, .16, 40]} /><meshStandardMaterial color="#bb8053" metalness={1} roughness={.3} /></mesh>
      <RoundedBox args={[1.04, 1.04, .4]} radius={.14} smoothness={4}><meshStandardMaterial color="#172229" metalness={.8} roughness={.24} /></RoundedBox>
      <RoundedBox args={[.92, .92, .025]} radius={.12} position={[0, 0, .205]}><meshStandardMaterial color={powered?'#8bdeed':'#152126'} emissive={powered?'#42a7c0':'#000000'} emissiveIntensity={powered?.65:0} /></RoundedBox>
      <RoundedBox args={[.865, .865, .035]} radius={.1} position={[0, 0, .217]}><meshStandardMaterial color="#070e13" metalness={.3} roughness={.2} /></RoundedBox>
      <group position={[0, 0, .02]}><PumpDisplay temperature={temperature} powered={powered} /></group>
      {[-.59, .59].flatMap(sx => [-.35, .35].map(sy => <group key={`${sx}:${sy}`} position={[sx, sy, -.13]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.065, .065, .16, 6]} /><meshStandardMaterial color="#9ba6ab" metalness={1} roughness={.25} /></mesh><mesh position={[0, 0, .09]}><boxGeometry args={[.075, .018, .01]} /><meshStandardMaterial color="#172126" /></mesh></group>))}
      {[.18, -.17].map(sy => <Fitting key={sy} position={[.55, sy, 0]} horizontal />)}
    </group>
    <group name="top-radiator" position={[0, 4.75, -.95]} rotation={[Math.PI / 2, 0, 0]}>
      {[-.98, .98].map(sy => <RoundedBox key={sy} args={[6.05, .12, .44]} radius={.04} position={[0, sy, 0]}><meshStandardMaterial color="#26343b" metalness={.9} roughness={.32} /></RoundedBox>)}
      {[-2.82, 2.82].map(sx => <RoundedBox key={sx} args={[.42, 1.9, .44]} radius={.1} position={[sx, 0, 0]}><meshStandardMaterial color="#34434b" metalness={.9} roughness={.3} /></RoundedBox>)}
      {Array.from({ length: 90 }, (_, i) => <mesh key={i} position={[-2.58 + i * .058, 0, 0]}><boxGeometry args={[.015, 1.85, .32]} /><meshStandardMaterial color="#647076" metalness={.9} roughness={.42} /></mesh>)}
      {[-.6, -.2, .2, .6].map(sy => <mesh key={sy} position={[0, sy, 0]}><boxGeometry args={[5.25, .06, .36]} /><meshStandardMaterial color="#25343b" metalness={.9} roughness={.3} /></mesh>)}
      {[-1.8, 0, 1.8].map(sx => <Fan key={sx} position={[sx, 0, .24]} size={.88} scaleX={1 / CASE_WIDTH_SCALE} rpm={fanRpm} />)}
      {[-2.4, 0, 2.4].flatMap(sx => [-.95, .95].map(sy => <mesh key={`${sx}:${sy}`} position={[sx, sy, -.2]}><boxGeometry args={[.18, .28, .2]} /><meshStandardMaterial color="#77858a" metalness={.9} /></mesh>))}
    </group>
    {[0, 1].map(i => <Fitting key={i} position={[2.65, 4.5, -1.25 + i * .65]} />)}
    {tubes.map((points, i) => <BraidedTube key={i} points={points} />)}
  </group>
}
