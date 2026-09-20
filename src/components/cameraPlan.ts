import * as THREE from 'three'
import type { ComponentId } from '../data/components'
import { BOARD_POSITION, CPU_MOUNT, GPU_MOUNT, RAM_MOUNT, SSD_MOUNT, INSPECTION_NORMAL, INSPECTION_RIGHT, WORLD_UP, localToWorld, worldToLocal } from './layout'

type Preset = { target: [number, number, number]; side: number; lateral: number; vertical: number }
export const cameraPresets: Record<ComponentId | 'hero' | 'desk', Preset> = {
  monitor: { target: [-9, .8, 0], side: 15, lateral: 0, vertical: .5 },
  desk: { target: [-4.5, 1, 0], side: 24, lateral: 1, vertical: 5 },
  cpu: { target: [CPU_MOUNT[0] + .35, CPU_MOUNT[1] + .15, -2.15], side: 9, lateral: 1.6, vertical: 1.2 },
  ram: { target: [RAM_MOUNT[0] + .3, RAM_MOUNT[1], -2.7], side: 8.2, lateral: -1.9, vertical: .8 },
  ssd: { target: [SSD_MOUNT[0], SSD_MOUNT[1], -2.85], side: 8, lateral: .9, vertical: .9 },
  gpu: { target: [GPU_MOUNT[0], .15, -1.5], side: 10, lateral: 4.5, vertical: .6 },
  motherboard: { target: [BOARD_POSITION[0] + .3, 1.8, -2.9], side: 12.8, lateral: 1.9, vertical: .8 },
  psu: { target: [-1.2, -2, 1.63], side: 7.6, lateral: 1.6, vertical: .5 },
  cooling: { target: [-.1, 3.25, -1.6], side: 10.2, lateral: 1.4, vertical: -.5 },
  case: { target: [0, 1.1, 0], side: 15.5, lateral: 4.2, vertical: 5 },
  hero: { target: [0, 1.1, 0], side: 15.5, lateral: 4.2, vertical: 5 },
}

export function focusCandidates(id: ComponentId | 'hero' | 'desk') {
  const p = cameraPresets[id]
  const target = localToWorld(new THREE.Vector3(...p.target))
  return [0, 10, -10, 20, -20, 30, -30].flatMap(degrees => [0, -.6, .6].map(height => {
    const angle = Math.atan2(p.lateral, p.side) + THREE.MathUtils.degToRad(degrees)
    const distance = Math.hypot(p.side, p.lateral)
    const position = target.clone().addScaledVector(INSPECTION_NORMAL, Math.cos(angle) * distance)
      .addScaledVector(INSPECTION_RIGHT, Math.sin(angle) * distance).addScaledVector(WORLD_UP, p.vertical + height)
    return { position, target }
  })).filter(pose => worldToLocal(pose.position).z > 4.3)
}

// Conservative envelope includes all hardware, frame, glass and feet. The path
// uses straight, eased legs: spline smoothing could cut a corner through a wall.
export const CASE_BOUNDS = new THREE.Box3(new THREE.Vector3(-4.3, -3.6, -3.7), new THREE.Vector3(4.3, 5.55, 3.75))
export function segmentCrossesBox(a: THREE.Vector3, b: THREE.Vector3, box = CASE_BOUNDS) {
  const delta = b.clone().sub(a)
  const length = delta.length()
  if (length < 1e-8) return box.containsPoint(a)
  const hit = new THREE.Ray(a, delta.normalize()).intersectBox(box, new THREE.Vector3())
  return box.containsPoint(a) || (!!hit && hit.distanceTo(a) < length - 1e-6)
}

export function safeCameraPath(fromWorld: THREE.Vector3, toWorld: THREE.Vector3, hardwareClear?: (from: THREE.Vector3, to: THREE.Vector3) => boolean) {
  const from = worldToLocal(fromWorld), to = worldToLocal(toWorld)
  const nodes = [from, to]
  for (const x of [-5, 5]) for (const y of [1.2, 6.3]) for (const z of [-4.4, 4.5]) nodes.push(new THREE.Vector3(x, y, z))
  nodes.push(new THREE.Vector3(0, 1.5, 7))
  nodes.push(new THREE.Vector3(from.x, from.y, 4.5))
  const costs = nodes.map(() => Infinity), previous = nodes.map(() => -1), visited = new Set<number>()
  costs[0] = 0
  while (visited.size < nodes.length) {
    let current = -1
    nodes.forEach((_, i) => { if (!visited.has(i) && (current < 0 || costs[i] < costs[current])) current = i })
    if (current < 0 || !Number.isFinite(costs[current])) break
    if (current === 1) break
    visited.add(current)
    nodes.forEach((node, i) => {
      if (visited.has(i)) return
      // For a camera manually zoomed into the open cavity, use real hardware
      // bounds to find its exit. Never assume that a straight +Z escape is clear.
      const leavingCavity = current === 0 && CASE_BOUNDS.containsPoint(from) && hardwareClear && !CASE_BOUNDS.containsPoint(node)
      if (!leavingCavity && segmentCrossesBox(nodes[current], node)) return
      if (hardwareClear && !hardwareClear(localToWorld(nodes[current]), localToWorld(node))) return
      const distance = costs[current] + node.distanceTo(nodes[current])
      if (distance < costs[i]) { costs[i] = distance; previous[i] = current }
    })
  }
  if (previous[1] < 0) {
    // If the user has placed the camera inside solid geometry, there may be no
    // collision-free exit. Keep their pose instead of inventing an unsafe path.
    return null
  }
  const route = [1]
  while (route[route.length - 1] !== 0) route.push(previous[route[route.length - 1]])
  return route.reverse().map(i => localToWorld(nodes[i]))
}
