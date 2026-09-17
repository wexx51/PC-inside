# PC INSIDE takeover review

## Initial implementation

The workspace contained a small Vite/React application without a `.git` directory. Existing files were edited in place; no reset or project replacement was performed.

- `App.tsx` owned selection, internal/external mode, load mode, telemetry, architecture navigation, boot progress, and flow toggles.
- `PCScene.tsx` contained the entire R3F scene, procedural component models, camera director, OrbitControls, selection handlers, cables, and animated educational pulses.
- `useFanAudio.ts` already provided filtered procedural noise and a motor oscillator. This architecture was retained and hardened.
- Boot was a timed educational sequence, not a camera cinematic. Architecture was a separate React diagram.
- The baseline production build failed with an unused inspection-right vector and two invalid OrbitControls type assertions.

## Camera findings

The glass face is local **+Z**, currently at `z = 1.5`. The front intake grille is local **+X**, while the motherboard tray remains behind the board at negative Z. The enclosure depth is shortened only from the glass side, so the motherboard-side rear plane does not move. The assembly is 10% wider on local X and rotated −0.34 radians around Y. `layout.ts` expresses these transforms and the outward inspection normal explicitly.

The inherited director already attempted to end its transition; it was not an unconditional perpetual lerp. Other defects remained:

1. Selection handlers accepted the click emitted after an orbit drag. R3F forwards clicks on initial hit objects even when the pointer moved; a drag across another selectable assembly could therefore start another focus transition.
2. Once `resetToken` became nonzero, its truthiness permanently selected the hero preset and masked subsequent component selections.
3. OrbitControls could retain damping velocity while the application also called `update()` during a transition.
4. Camera candidates only passed a hemisphere/distance check. There was no line-of-sight raycast or safe route around the enclosure.
5. Fading/moving the glass did not remove its opaque trim bars.

The new director consumes explicit focus/reset events. A finite sequence of eased segments owns position and orientation only while `focusTransition` is active. At completion it clears the transition and enables damped, unrestricted horizontal/vertical orbit and zoom. Telemetry updates, closing the information panel, and flow toggles do not start focus transitions. Selecting the same component again intentionally refocuses it.

Focus candidates vary by component and are built from inspection normal, inspection right, and world up. Raycasts test the case and other hardware, trying alternate angles on the same side. A visibility graph routes exterior transitions around conservative chassis bounds; transformed mesh bounds with clearance also validate travel. For a camera manually placed inside the opening, a checked exit is required. If the camera is inside a solid object and no safe route exists, the director preserves manual ownership.

## Geometry and thermal pipeline

- The board is 4.4 × 5.5 scene units: exactly the supplied 244:305 ATX ratio. Shared socket/mount transforms align CPU, DIMMs, NVMe, PCIe, and cable endpoints. The GPU is seated horizontally and anchored at the rear expansion area.
- Internal mode removes the glass and the PSU shroud's access face. The roof, posts, tray, base, grille, and shroud roof remain.
- The top AIO includes cold plate, machined pump housing, bracket, screws, RGB rim, display, two braided tubes and fittings, radiator rails/end tanks/fins, and three fans. Front intake fans and existing GPU/PSU fans use the same RPM signal.
- `useSimulation.ts` retains floating-point state. Workload drives CPU/GPU utilization; utilization and cooling drive temperatures; temperature drives target RPM; RPM approaches its target over time.
- Only presentation values are rounded. Telemetry and the AIO's reusable 256×192 canvas texture receive the same rounded CPU temperature. Fan animation uses a fixed temporal scale of actual RPM so blades remain legible.
- The existing audio graph reads that RPM, smoothly adjusting filtered airflow, a quiet mechanical hum, and gain. The graph is created/resumed only by the SOUND control, catches unsupported/suspended-context failures, and mutes smoothly.
- Static cable/flow/model subtrees are memoized. Temperature changes repaint the existing display texture rather than rebuilding text geometry.

## Validation

`npm run build`, `npm run lint`, and `npm test` provide production, static, and Chrome browser checks. The browser suite uses real mouse drags and wheel input against the actual R3F camera, waits ten seconds after orbit release for each of the seven internal components, and exercises reset/reselection, glass mode, exploded view, boot, and architecture. It also measures the load/temperature/RPM/audio response through idle → normal → high → idle and verifies the pump display against telemetry. Route tests cover 864 exterior starting poses; numerical tests check fan smoothness and convergence.

The full Chrome suite contains 14 tests covering the boot controller, process modes, language switch, component inspection, camera ownership, thermal/audio behavior, and shutdown. Production build and lint pass. A representative recorded thermal/audio cycle was:

| Workload | Fan RPM | CPU telemetry and AIO display |
| --- | ---: | ---: |
| Idle | 702 | 38°C |
| Normal | 1,283 | 55°C |
| High | 1,888 | 82°C |
| Return to idle | 704 | 38°C |

The installed R3F version constructs `THREE.Clock`, which Three.js r186 deprecates. That upstream warning is not suppressed in the application. The repeated removed-shadow-mode warning was fixed by explicitly selecting `PCFShadowMap`. The production bundle still produces Vite's size advisory for the Three.js bundle.
