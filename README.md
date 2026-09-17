# PC INSIDE

Interactive educational simulator that explains how a desktop computer powers on, initializes its hardware, moves data, and responds to workload and cooling.

Built with React, TypeScript, Vite, Three.js, and React Three Fiber. The interface is available in Russian and English.

## Features

- Guided boot sequence from PSU startup to a running operating system
- Power, CPU, memory, graphics, storage, cooling, and overview visualizations
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
├── data/                  # Component descriptions
├── hooks/                 # Thermal simulation and procedural audio
├── system/                # Boot state machine
├── App.tsx                # Application modes and UI composition
└── i18n.ts                # Russian and English copy
tests/                     # Playwright browser and numerical tests
docs/                      # Implementation notes
```

## Architecture

The boot controller is the single source of truth for the current system phase and phase progress. The simulation follows one pipeline:

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
