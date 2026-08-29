import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type DragEvent as RDragEvent,
} from "react";
import {
  Canvas,
  useThree,
  type RootState,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Move, RotateCw } from "lucide-react";
import { useStore } from "../../store/useStore";
import { snap as snapTo } from "../../lib/utils";
import Floor from "./Floor";
import Walls3D from "./Walls3D";
import FurnitureModel from "./FurnitureModel";

/** Swallows optional-feature load errors (e.g. Environment HDR offline). */
class SilentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Exposes the R3F root (camera/gl/raycaster) to the outer DOM for drop + drag. */
function R3FBridge({ apiRef }: { apiRef: React.MutableRefObject<RootState | null> }) {
  const three = useThree();
  useEffect(() => {
    apiRef.current = three;
  });
  return null;
}

type DragMode = "translate" | "rotate";

interface Drag {
  id: string;
  mode: DragMode;
  grabDX: number;
  grabDZ: number;
  cx: number;
  cz: number;
}

/**
 * Furniture is manipulated by dragging it directly on the floor — grab a piece
 * and slide it (translate) or swing it around its center (rotate). This mirrors
 * the 2D plan's interaction model and is far more reliable and intuitive than a
 * screen-space transform gizmo for placing furniture.
 */
export default function Viewport3D({ active }: { active: boolean }) {
  const apiRef = useRef<RootState | null>(null);
  const orbitRef = useRef<any>(null);
  const dragRef = useRef<Drag | null>(null);

  const furniture = useStore((s) => s.furniture);
  const selectedId = useStore((s) => s.selectedId);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const gridSize = useStore((s) => s.gridSize);
  const select = useStore((s) => s.select);
  const addFurniture = useStore((s) => s.addFurniture);
  const moveFurniture = useStore((s) => s.moveFurniture);
  const rotateFurniture = useStore((s) => s.rotateFurniture);

  const [mode, setMode] = useState<DragMode>("translate");

  // raycast a screen point onto the floor plane (y = 0)
  const floorPoint = (clientX: number, clientY: number): THREE.Vector3 | null => {
    const api = apiRef.current;
    if (!api) return null;
    const rect = api.gl.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    api.raycaster.setFromCamera(ndc, api.camera);
    const hit = new THREE.Vector3();
    return api.raycaster.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      hit
    )
      ? hit
      : null;
  };

  // hotkeys + window-level drag handling while this viewport is active
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "g") setMode("translate");
      if (e.key === "r") setMode("rotate");
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const p = floorPoint(e.clientX, e.clientY);
      if (!p) return;
      if (d.mode === "translate") {
        let x = p.x - d.grabDX;
        let z = p.z - d.grabDZ;
        if (snapEnabled) {
          x = snapTo(x, gridSize);
          z = snapTo(z, gridSize);
        }
        moveFurniture(d.id, [x, 0, z]);
      } else {
        // 0 rad = facing -z, matching the 2D front indicator
        rotateFurniture(d.id, Math.atan2(p.x - d.cx, -(p.z - d.cz)));
      }
      apiRef.current?.invalidate();
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      if (orbitRef.current) orbitRef.current.enabled = true;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [active, snapEnabled, gridSize, moveFurniture, rotateFurniture]);

  // pointer-down on a furniture piece: select it and begin a floor drag
  const beginDrag = (e: ThreeEvent<PointerEvent>, id: string) => {
    e.stopPropagation();
    select(id);
    const f = useStore.getState().furniture.find((x) => x.id === id);
    if (!f) return;
    const p = floorPoint(e.nativeEvent.clientX, e.nativeEvent.clientY);
    dragRef.current = {
      id,
      mode,
      grabDX: p ? p.x - f.position[0] : 0,
      grabDZ: p ? p.z - f.position[2] : 0,
      cx: f.position[0],
      cz: f.position[2],
    };
    if (orbitRef.current) orbitRef.current.enabled = false;
  };

  // drop from catalog → raycast against the floor plane (y = 0)
  const onDrop = (e: RDragEvent) => {
    e.preventDefault();
    const catalogId = e.dataTransfer.getData("application/x-furniture");
    if (!catalogId) return;
    const p = floorPoint(e.clientX, e.clientY);
    if (!p) return;
    const x = snapEnabled ? snapTo(p.x, gridSize) : p.x;
    const z = snapEnabled ? snapTo(p.z, gridSize) : p.z;
    addFurniture(catalogId, [x, 0, z], 0);
  };

  return (
    <div
      className="relative h-full w-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        // "demand" renders only when something actually changes (orbit, drag,
        // scene edits) instead of pinning the GPU at 60fps forever. OrbitControls
        // invalidates on change, React commits invalidate on edits, and the drag
        // handler calls invalidate() explicitly.
        frameloop="demand"
        camera={{ position: [6.5, 5.5, 7], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={() => select(null)}
      >
        <R3FBridge apiRef={apiRef} />
        <color attach="background" args={["#0d1017"]} />
        <fog attach="fog" args={["#0d1017", 22, 55]} />

        {/* lighting */}
        <hemisphereLight args={["#dfe7ff", "#0e1218", 0.6]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={2.1}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0004}
        >
          <orthographicCamera
            attach="shadow-camera"
            args={[-14, 14, 14, -14, 0.1, 50]}
          />
        </directionalLight>
        <directionalLight position={[-6, 5, -4]} intensity={0.5} color="#9fb4ff" />

        <Suspense fallback={null}>
          <SilentBoundary>
            <Environment preset="apartment" />
          </SilentBoundary>
        </Suspense>

        <Floor />
        <Walls3D />

        {furniture.map((f) => (
          <FurnitureModel
            key={f.id}
            item={f}
            selected={f.id === selectedId}
            onPointerDownItem={beginDrag}
          />
        ))}

        <ContactShadows
          position={[0, 0.004, 0]}
          opacity={0.45}
          scale={40}
          blur={2.2}
          far={6}
          color="#000000"
        />

        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={32}
          maxPolarAngle={Math.PI / 2 - 0.04}
          target={[0, 0.8, 0]}
        />
      </Canvas>

      {/* move / rotate mode switch */}
      {selectedId && (
        <div className="absolute right-3 top-3 flex overflow-hidden rounded-lg border border-line bg-panel-2/80 backdrop-blur">
          <button
            onClick={() => setMode("translate")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs ${
              mode === "translate" ? "bg-accent text-white" : "text-muted hover:text-ink"
            }`}
          >
            <Move size={14} /> Move
          </button>
          <button
            onClick={() => setMode("rotate")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs ${
              mode === "rotate" ? "bg-accent text-white" : "text-muted hover:text-ink"
            }`}
          >
            <RotateCw size={14} /> Rotate
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 px-2.5 py-1 text-xs text-muted backdrop-blur">
        Drag furniture to {mode === "translate" ? "move" : "rotate"} · Drag empty
        space to orbit · Scroll to zoom · G / R to switch mode
      </div>
    </div>
  );
}
