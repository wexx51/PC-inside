import * as THREE from 'three'

export const CASE_YAW = -.34
// Local case width is 10% wider. The glass-side depth is reduced separately in
// PCScene while the motherboard-side rear plane remains fixed.
export const CASE_WIDTH_SCALE = 1.1
export const CASE_ORIGIN = new THREE.Vector3(0, -.05, 0)
export const WORLD_UP = new THREE.Vector3(0, 1, 0)
// The glass lies in local XY; the front intake grille is at local X=3.8.
const scaleCaseWidth = (p: THREE.Vector3) => p.setX(p.x * CASE_WIDTH_SCALE)
export const INSPECTION_NORMAL = scaleCaseWidth(new THREE.Vector3(0, 0, 1)).applyAxisAngle(WORLD_UP, CASE_YAW).normalize()
export const INSPECTION_RIGHT = scaleCaseWidth(new THREE.Vector3(1, 0, 0)).applyAxisAngle(WORLD_UP, CASE_YAW).normalize()
export const localToWorld = (p: THREE.Vector3) => scaleCaseWidth(p.clone()).applyAxisAngle(WORLD_UP, CASE_YAW).add(CASE_ORIGIN)
export const worldToLocal = (p: THREE.Vector3) => {
  const local = p.clone().sub(CASE_ORIGIN).applyAxisAngle(WORLD_UP, -CASE_YAW)
  local.x /= CASE_WIDTH_SCALE
  return local
}
export const BOARD_POSITION: [number, number, number] = [-1.8, 1.8, -3.22]
// 4.4 × 5.5 units = 244 × 305 mm. Bottom clears the PSU shroud by .12;
// rear I/O meets the rear wall, with .53 above the PCB before the roof.
export const BOARD_SCALE: [number, number, number] = [4.4 / 6.55, 5.5 / 7.55, 1]
export const boardPoint = (x: number, y: number, z: number): [number, number, number] => [BOARD_POSITION[0] + x * BOARD_SCALE[0], BOARD_POSITION[1] + y * BOARD_SCALE[1], BOARD_POSITION[2] + z]
export const CPU_MOUNT = boardPoint(-.8, 1.45, .38)
export const PUMP_MOUNT = boardPoint(-.8, 1.45, .77)
export const RAM_MOUNT = boardPoint(1.3, 1.2, .38)
export const SSD_MOUNT = boardPoint(-.25, -.25, .28)
export const GPU_MOUNT: [number, number, number] = [-.8, boardPoint(.55, -.9, .2)[1] - .58, -1.95]
export const PSU_MOUNT: [number, number, number] = [-1.2, -2.05, -.17]
