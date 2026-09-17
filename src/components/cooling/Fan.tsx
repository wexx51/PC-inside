import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Fan({ position, rotation = [0, 0, 0], size = 1, scaleX = 1, load = 45, rpm, accent = '#83dcff' }: { position: [number, number, number]; rotation?: [number, number, number]; size?: number; scaleX?: number; load?: number; rpm?: number; accent?: string }) {
  const rotor = useRef<THREE.Group>(null)
  const [frame, blade] = useMemo(() => {
    const outline = new THREE.Shape()
    outline.moveTo(-1, -1); outline.lineTo(1, -1); outline.lineTo(1, 1); outline.lineTo(-1, 1); outline.closePath()
    const opening = new THREE.Path(); opening.absarc(0, 0, .89, 0, Math.PI * 2, true); outline.holes.push(opening)
    for (const x of [-.86, .86]) for (const y of [-.86, .86]) {
      const hole = new THREE.Path(); hole.absarc(x, y, .055, 0, Math.PI * 2, true); outline.holes.push(hole)
    }
    const shape = new THREE.Shape()
    shape.moveTo(.10, -.08); shape.quadraticCurveTo(.72, -.13, .84, .16); shape.quadraticCurveTo(.5, .22, .12, .12); shape.closePath()
    return [new THREE.ExtrudeGeometry(outline, { depth: .26, bevelEnabled: false, curveSegments: 24 }), new THREE.ExtrudeGeometry(shape, { depth: .055, bevelEnabled: true, bevelSegments: 2, bevelSize: .012, bevelThickness: .012 })]
  }, [])
  useEffect(() => () => { frame.dispose(); blade.dispose() }, [frame, blade])
  useFrame((_, delta) => {
    // Uniform temporal scale avoids strobing while retaining the simulated RPM ratio.
    if (rotor.current) rotor.current.rotation.z = (rotor.current.rotation.z + Math.min(delta, .1) * Math.max(0, rpm ?? 650 + load * 12.5) * Math.PI / 30 * .085) % (Math.PI * 2)
  })
  return <group name="fan" userData={{ rpm }} position={position} rotation={rotation} scale={[size * scaleX, size, size]}>
    <mesh geometry={frame}><meshStandardMaterial color="#172126" metalness={.65} roughness={.34} /></mesh>
    {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map(angle => <mesh key={angle} rotation={[0, 0, angle]} position={[0, 0, .01]}><boxGeometry args={[1.76, .065, .04]} /><meshStandardMaterial color="#182329" /></mesh>)}
    <mesh position={[0, 0, .24]}><torusGeometry args={[.90, .018, 6, 48]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={.45} /></mesh>
    <group ref={rotor} name="rotor" position={[0, 0, .14]}>
      {Array.from({ length: 9 }, (_, i) => <mesh key={i} geometry={blade} rotation={[0, 0, i * Math.PI * 2 / 9]}><meshStandardMaterial color="#43535a" metalness={.48} roughness={.4} /></mesh>)}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, .03]}><cylinderGeometry args={[.25, .25, .15, 32]} /><meshStandardMaterial color="#19242b" metalness={.65} roughness={.3} /></mesh>
      <mesh position={[0, 0, .12]}><circleGeometry args={[.12, 24]} /><meshStandardMaterial color="#a9b7bb" metalness={.9} roughness={.25} /></mesh>
    </group>
  </group>
}
