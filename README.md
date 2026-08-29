# Interior Studio — 2D/3D Room Planner

An interactive interior-design web app (inspired by Planner 5D). Draw walls on a
2D blueprint, drop furniture from a catalog, then flip to a realistic 3D view that
renders the **same shared state** — walls extruded to 2.8 m, furniture placed and
orientable with transform gizmos.

## Tech stack

- **React + TypeScript + Vite**
- **Three.js** via `@react-three/fiber` + `@react-three/drei` (3D viewport)
- **SVG** engine for the 2D blueprint (grid, pan/zoom, wall drawing)
- **Zustand** — single shared store driving both viewports (`src/store/useStore.ts`)
- **Tailwind CSS** + **lucide-react** icons

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Features

| Area | What it does |
|------|--------------|
| **Dual viewport** | Toggle 2D ⇄ 3D in the top bar; both stay in sync, crossfade on switch. |
| **2D blueprint** | Snap-to-grid grid, **wall tool** (click to chain segments, Esc to finish), pan (Hand tool / middle-mouse), wheel-zoom toward cursor. |
| **Furniture** | Drag from the sidebar into **either** the 2D or 3D viewport (or double-click to drop at origin). |
| **3D scene** | Orthographic-shadowed directional + hemisphere lighting, `Environment` reflections (optional), contact shadows, `OrbitControls` clamped above the floor. |
| **Gizmos** | Selected item shows translate/rotate `TransformControls` in 3D (G/R to switch) and move/rotate handles in 2D. |
| **Properties** | Precise X/Z, rotation, scale, duplicate, delete in the right panel. |

### Keyboard

`V` select · `W` wall · `G`/`R` 3D move/rotate gizmo · `Delete` remove selected ·
`Esc` finish wall drawing.

## Asset pipeline (Sketchfab / glTF)

Furniture is defined in `src/data/catalog.ts`. Each item carries a footprint used by
both the 2D renderer and a **stylized primitive fallback** (`PrimitiveModels.tsx`), plus
an optional `glb` filename.

- The app loads `/public/assets/<glb>` via `useGLTF`, auto-fits it to the footprint,
  and **falls back to the primitive** through an error boundary if the file is missing
  or fails to load — so it always renders.
- A real **CC0** asset (`SheenChair.glb`, from the Khronos glTF-Sample-Assets repo) is
  bundled for the *Dining Chair*.

### Adding more realistic models

> Sketchfab downloads require an OAuth token and per-model licensing, so direct API
> download isn't wired in. To add a model: download a `.glb` (Sketchfab "Downloadable" +
> CC, Poly Pizza, or KhronosGroup sample assets), drop it in `public/assets/`, and set
> its filename on the matching catalog item's `glb` field. No code changes needed.

## Project layout

```
src/
  store/useStore.ts            shared 2D/3D state (walls, furniture, mode, selection)
  data/catalog.ts              furniture definitions + GLB mapping
  components/
    ui/                        Toolbar, Sidebar (catalog), PropertiesPanel
    viewport2d/Viewport2D.tsx  SVG blueprint engine
    viewport3d/                Canvas, lighting, Walls3D, Floor, FurnitureModel, primitives
```
