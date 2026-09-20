import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import type { ComponentId } from '../data/components'
import { focusCandidates, safeCameraPath, segmentCrossesBox } from './cameraPlan'

type Props = { selected: ComponentId | null; deskToken: number; focusToken: number; resetToken: number; internal: boolean; guidedTour: boolean; paused: boolean; onManualControl: () => void }
type Transition = { path: THREE.Vector3[]; fromTarget: THREE.Vector3; target: THREE.Vector3; elapsed: number; duration: number; leg: number }

export function CameraDirector({ selected, deskToken, focusToken, resetToken, internal, guidedTour, paused, onManualControl }: Props) {
  const scene = useThree(state => state.scene)
  const gl = useThree(state => state.gl)
  const orbit = useRef<OrbitControlsImpl>(null)
  const mode = useRef<'manual' | 'focusTransition' | 'tourTransition'>('manual')
  const transition = useRef<Transition | null>(null)
  const previous = useRef({ focusToken: -1, resetToken: -1, deskToken, internal })
  const guided = useRef(guidedTour)
  useEffect(() => { guided.current = guidedTour }, [guidedTour])

  const releaseCamera = () => {
    const controls = orbit.current
    if (!controls || !transition.current) return
    transition.current = null
    mode.current = 'manual'
    controls.enabled = true
    controls.enableDamping = true
    controls.object.userData.mode = 'manual'
  }

  useEffect(() => {
    const interrupt = () => {
      releaseCamera()
      if (guided.current) onManualControl()
    }
    gl.domElement.addEventListener('pointerdown', interrupt, { capture: true })
    gl.domElement.addEventListener('wheel', interrupt, { capture: true, passive: true })
    return () => {
      gl.domElement.removeEventListener('pointerdown', interrupt, { capture: true })
      gl.domElement.removeEventListener('wheel', interrupt, { capture: true })
    }
  }, [gl, onManualControl])

  useEffect(() => { if (paused) releaseCamera() }, [paused])

  useEffect(() => {
    const controls = orbit.current
    if (!controls) return
    const camera = controls.object
    const old = previous.current
    const reset = resetToken !== old.resetToken
    const focus = focusToken !== old.focusToken
    const opening = internal && !old.internal
    const desk = deskToken !== old.deskToken
    previous.current = { focusToken, resetToken, deskToken, internal }
    if (!reset && !focus && !opening && !desk) return
    const id = desk ? 'desk' : reset ? 'hero' : selected ?? 'hero'
    scene.updateMatrixWorld(true)
    const obstacles: THREE.Object3D[] = []
    scene.traverse(object => {
      const component = object.name.replace('component-', '')
      const related = component === id || (['cpu', 'cooling'].includes(id) && ['cpu', 'cooling'].includes(component))
      if (object.userData.cameraObstacle || (object.name.startsWith('component-') && !related && component !== 'case' && id !== 'hero' && id !== 'case' && id !== 'desk')) obstacles.push(object)
    })
    const ray = new THREE.Raycaster()
    const candidates = focusCandidates(id)
    const clear = (pose: typeof candidates[number]) => {
      const direction = pose.target.clone().sub(pose.position)
      ray.set(pose.position, direction.clone().normalize())
      ray.far = direction.length() - .15
      return !ray.intersectObjects(obstacles, true).some(hit => {
        // Glass is an intentional part of the sealed exterior composition.
        let node: THREE.Object3D | null = hit.object
        while (node) { if (node.name === 'glass-panel' && (id === 'case' || id === 'hero' || id === 'desk')) return false; node = node.parent }
        return true
      })
    }
    const destination = candidates.find(clear)
    // Keep manual ownership if geometry changes invalidate every same-side shot.
    if (!destination) { console.warn(`No unobstructed ${id} inspection shot`); return }
    const travelObstacles: { bounds: THREE.Box3; inverse: THREE.Matrix4 }[] = []
    scene.traverse(object => {
      // Exact mesh bounds keep hollow assemblies (fans, case and radiator) open.
      // Ignore floor, decorative stars, lighting and educational pulse markers.
      if (!(object instanceof THREE.Mesh)) return
      let parent: THREE.Object3D | null = object
      let hardware = false
      while (parent) {
        if (parent.name.startsWith('component-') || parent.userData.cameraObstacle) hardware = true
        parent = parent.parent
      }
      if (hardware) {
        object.geometry.computeBoundingBox()
        if (object.geometry.boundingBox) travelObstacles.push({ bounds: object.geometry.boundingBox.clone().expandByScalar(.12), inverse: object.matrixWorld.clone().invert() })
      }
    })
    const path = safeCameraPath(camera.position, destination.position, (a, b) => !travelObstacles.some(({ bounds, inverse }) => segmentCrossesBox(a.clone().applyMatrix4(inverse), b.clone().applyMatrix4(inverse), bounds)))
    if (!path) return
    // Flush residual OrbitControls damping once, preserving the actual starting
    // pose. It must never perturb the authored path or the final handoff.
    const start = camera.position.clone()
    controls.enabled = false
    controls.enableDamping = false
    controls.update()
    camera.position.copy(start)
    transition.current = { path, fromTarget: controls.target.clone(), target: destination.target, elapsed: 0, duration: Math.max(.65, path[0].distanceTo(path[1]) / 13), leg: 0 }
    mode.current = guidedTour ? 'tourTransition' : 'focusTransition'
    camera.userData.mode = mode.current
    camera.userData.focus = id
    camera.userData.path = path.map(p => p.toArray())
  }, [focusToken, resetToken, deskToken, internal, selected, scene, guidedTour])

  useFrame(({ camera }, delta) => {
    const active = transition.current, controls = orbit.current
    if (mode.current === 'manual' || !active || !controls) return
    active.elapsed += Math.min(delta, .1)
    const t = Math.min(1, active.elapsed / active.duration)
    const ease = t * t * (3 - 2 * t)
    camera.position.lerpVectors(active.path[active.leg], active.path[active.leg + 1], ease)
    const progress = (active.leg + ease) / (active.path.length - 1)
    controls.target.lerpVectors(active.fromTarget, active.target, progress)
    camera.lookAt(controls.target)
    if (t < 1) return
    if (active.leg < active.path.length - 2) {
      active.leg += 1
      active.elapsed = 0
      active.duration = Math.max(.65, active.path[active.leg].distanceTo(active.path[active.leg + 1]) / 13)
      return
    }
    controls.update()
    controls.enableDamping = true
    controls.enabled = true
    transition.current = null
    mode.current = 'manual'
    camera.userData.mode = mode.current
  })

  return <OrbitControls ref={orbit} makeDefault enablePan={false} enableDamping dampingFactor={.12} minDistance={2} maxDistance={35} minPolarAngle={.015} maxPolarAngle={Math.PI - .015} />
}
