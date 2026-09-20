# PC INSIDE

Interactive educational simulator that explains how a desktop computer powers on, initializes its hardware, moves data, and responds to workload and cooling.

Built with React, TypeScript, Vite, Three.js, and React Three Fiber. The interface is available in Russian and English.

## Features

- Guided boot sequence covering power, UEFI, POST, boot-device selection, the bootloader, kernel loading, and drivers
- Power, CPU, memory, graphics, storage, I/O, network, application, cooling, and overview visualizations
- Structured component catalog with functions, specifications, data paths, relationships, and architecture roles
- Assignment overview with the laboratory goal and concise learning objectives
- A traced graphics-application example from user input and storage through CPU execution to GPU output
- Shared CPU/GPU load, temperature, fan RPM, AIO display, airflow, and audio simulation
- Internal and external case views with selectable components
- Finite camera transitions followed by unrestricted OrbitControls
- Exploded CPU, GPU, and motherboard views
- Presentation mode with keyboard controls and optional fullscreen
- Graceful shutdown sequence

## Requirements

- Node.js 20 or newer
- npm
- Google Chrome for the local Playwright test suite

## Local development

```bash
npm ci
npm run dev
```

Open the address printed by Vite, usually `http://localhost:5173`.

## Controls

- Select a component in the explorer or directly in the 3D scene.
- Drag to orbit and scroll to zoom after a camera transition finishes.
- Use **INTERNAL / EXTERNAL** to remove or restore the glass panel.
- Use **POWER ON** to start the boot sequence and **SHUT DOWN** to stop it safely.
- Use **GUIDED TOUR** for the automatic component walkthrough.
- Switch between **IDLE / NORMAL / HIGH** after the system reaches `SYSTEM READY`.
- Enable procedural fan audio with the sound button. Browser audio starts only after that user action.
- Switch the complete interface with the **RU / EN** control.

Presentation mode supports `Space`, `ArrowLeft`, `ArrowRight`, `R`, and `Escape`.

## Validation

```bash
npm run typecheck
npm run lint
npm run build
npm test
```

`npm run check` runs lint and the production build. Playwright starts Vite automatically and writes temporary output to `test-results/`, which Git ignores.

## Project structure

```text
src/
├── components/
│   ├── cooling/           # Reusable fan and AIO models
│   ├── CameraDirector.tsx # Focus, tour, collision checks, manual handoff
│   ├── PCScene.tsx        # Chassis, hardware and process visualization
│   ├── cameraPlan.ts      # Camera presets and safe route planning
│   └── layout.ts          # Shared transforms and mounting coordinates
├── data/                  # Reusable component, architecture, and lesson records
├── hooks/                 # Thermal simulation and procedural audio
├── system/                # Boot state machine
├── App.tsx                # Application modes and UI composition
└── i18n.ts                # Russian and English copy
tests/                     # Playwright browser and numerical tests
docs/                      # Implementation notes
```

## Architecture

The boot controller is the single source of truth for the current system phase and phase progress. Its ordered path is:

```text
power button → PSU / Power Good → CPU reset release → UEFI → POST
             → memory → GPU → storage → boot-device selection
             → bootloader → OS kernel → drivers → services → ready
```

The workload simulation follows one pipeline:

```text
system phase + workload
          ↓
CPU/GPU load
          ↓
CPU/GPU temperature
          ↓
target fan RPM
          ↓
fan animation · telemetry · AIO display · audio · airflow · thermal effects
```

The case keeps its motherboard-side rear plane fixed. Its glass side is moved inward to a depth of 5.24 scene units, its local width is scaled by 1.1, and its three front intake fans use a non-overlapping scale of 1.28.

See [the implementation review](docs/implementation-review.md) for camera ownership, coordinate conventions, performance decisions, and validation details.

## Educational coverage

ABOUT presents the goal and eleven learning objectives in the existing compact assignment page. ARCHITECTURE contains structured hardware references plus BIOS/UEFI, POST, boot-device selection, bootloader, operating system, drivers, input, output, and networking. Storage comparisons distinguish illustrative sequential read and write rates; the example PC uses the same SSD specifications as the component inspector.

The fourteen-stage boot controller remains the single source of truth. `src/system/bootConsole.ts` derives progress/completion messages from its phase and progress, including rewind, restart, skip, and shutdown. Prior running POWER or COOLING lessons do not suppress boot data packets, and PSU startup uses the existing component highlight. `tests/education.spec.ts` covers these behaviors and the educational acceptance content.

## Monitor output device

Select **MONITOR** in the component explorer to inspect the display, or use **SYSTEM / DESK** to see the computer and monitor together. Both views release the camera to manual orbit after the transition.

The Phase 1 monitor has a bezel, rear housing, metal stand and base, and a standby/power LED. It sits to the left of the case, clear of the open-side inspection view. Rounded parts use low subdivision counts; the screen is a separate two-triangle plane ready for future dynamic content.

The 16:9 screen reuses one 1280 × 720 CanvasTexture. The existing boot controller is its only source of state and progress: early power phases stay black, UEFI entry shows generic PC INSIDE firmware, hardware initialization shows POST checks, the bootloader identifies the NVMe boot device, and OS initialization fills a loading bar before the fictional desktop appears. Shutdown immediately blanks the screen. The firmware view is an educational representation of early startup, not a physical GPU readiness signal.

Loading progress spans the existing kernel, driver, and system initialization phases and uploads in 2% increments. Pause, step navigation, restart, and skip-to-running remain synchronized without any monitor timers. Static screens redraw only when their content changes. The texture is disposed on unmount. Files and Terminal remain decorative icons; LAUNCH BROWSER starts the execution demonstration below.

The physical display cable connects the rear GPU output to the monitor input through generic digital-display plugs and short strain reliefs. Its 64-segment, six-sided tube follows a slack curve above the floor and behind the monitor stand. A subtle purple pulse follows that exact curve from PC to monitor when DATA FLOW is enabled and the screen is active. Internal graphics paths stop at the GPU output so they do not duplicate the external pulse. The inspector explains Application → CPU / graphics API → GPU → display output → monitor. The existing SYSTEM / DESK view shows both devices and returns control to manual orbit; component presets remain intact.

Monitor regression coverage is in `tests/monitor.spec.ts`, alongside the existing camera, boot, audio, power-flow, and telemetry tests.

## Program execution and local network demonstration

After SYSTEM READY, select LAUNCH BROWSER. The shared execution controller (`src/system/executionMachine.ts`) advances through user input, OS request, process creation, SSD read, RAM loading, CPU execution, GPU rendering, display output, and application ready. The compact panel, component highlights, directed packets, and monitor all consume the same state. The initial desk transition releases the camera to OrbitControls; execution stages never reposition it.

At application ready, LOAD WEBSITE demonstrates a deterministic local response for example.com. Outbound traffic uses the OS/network-interface path; inbound data passes through the network interface and RAM to the CPU. Only processed graphics reach the GPU and monitor. No fetch, socket, or external page is involved. The final page reads PC INSIDE NETWORK DEMO. RESTART DEMO returns to user input without rebooting, and leaving SYSTEM READY invalidates the application demo.

Application visuals reuse the existing CanvasTexture. Cursor and processing animation use quantized controller progress; static application/page screens do not redraw with telemetry updates. `tests/execution.spec.ts` verifies state order, screen/hardware synchronization, button gating, local-only networking, restart, shutdown invalidation, and manual camera ownership.

## Continuous integration

[GitHub Actions](.github/workflows/ci.yml) installs dependencies, checks lint and the production build, then runs the Playwright suite with Chromium on every pull request and every push to `main`.

## Publishing to GitHub

After creating an empty repository on GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pc-inside.git
git push -u origin main
```

Do not commit `node_modules`, `dist`, Playwright output, local environment files, or editor settings; they are covered by `.gitignore`.
