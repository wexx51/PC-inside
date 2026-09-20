import { Vector3 } from 'three'
import { GPU_MOUNT } from './layout'

// Coordinates use the chassis frame. The monitor cancels its parent's X scale
// for its shape, but its centered input shares the same chassis X coordinate.
export const MONITOR_POSITION: [number, number, number] = [-9, 0, 0]
export const MONITOR_INPUT: [number, number, number] = [0, .25, -.47]
export const MONITOR_CABLE_INPUT: [number, number, number] = [0, .25, -.86]
export const GPU_DISPLAY_OUTPUT = new Vector3(-4.015, GPU_MOUNT[1], -1.95)
export const DISPLAY_CABLE_RADIUS = .047

// Plug strain relief → slack loop above the floor → rear monitor strain relief.
// Short straight approaches keep the cable aligned with both connector axes.
export const DISPLAY_ROUTE = [
  new Vector3(-4.54, GPU_DISPLAY_OUTPUT.y, GPU_DISPLAY_OUTPUT.z),
  new Vector3(-4.85, GPU_DISPLAY_OUTPUT.y, GPU_DISPLAY_OUTPUT.z),
  new Vector3(-5.3, -2.45, -2.3),
  new Vector3(-7, -2.8, -2.5),
  new Vector3(MONITOR_POSITION[0], -1.4, -1.5),
  new Vector3(MONITOR_POSITION[0], .25, -1.15),
  new Vector3(MONITOR_POSITION[0], MONITOR_CABLE_INPUT[1], MONITOR_CABLE_INPUT[2]),
]
