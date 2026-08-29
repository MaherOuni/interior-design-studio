import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
  type WheelEvent as RWheelEvent,
  type DragEvent as RDragEvent,
} from "react";
import { useStore, type Vec2, WALL_THICKNESS } from "../../store/useStore";
import { getItem } from "../../data/catalog";
import { clamp, snap as snapTo } from "../../lib/utils";

const PX_PER_M = 48; // base pixels per meter at zoom = 1
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 4;

interface View {
  zoom: number;
  panX: number;
  panY: number;
}

type Gesture =
  | { kind: "pan"; startX: number; startY: number; panX: number; panY: number }
  | {
      kind: "moveFurniture";
      id: string;
      grabDX: number;
      grabDZ: number;
    }
  | { kind: "rotateFurniture"; id: string; cx: number; cz: number }
  | null;

export default function Viewport2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [view, setView] = useState<View>({ zoom: 1, panX: 0, panY: 0 });

  const tool = useStore((s) => s.tool);
  const gridSize = useStore((s) => s.gridSize);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const showGrid = useStore((s) => s.showGrid);
  const walls = useStore((s) => s.walls);
  const furniture = useStore((s) => s.furniture);
  const selectedId = useStore((s) => s.selectedId);

  const addWall = useStore((s) => s.addWall);
  const moveFurniture = useStore((s) => s.moveFurniture);
  const rotateFurniture = useStore((s) => s.rotateFurniture);
  const addFurniture = useStore((s) => s.addFurniture);
  const select = useStore((s) => s.select);

  const gesture = useRef<Gesture>(null);
  const [wallDraft, setWallDraft] = useState<{ start: Vec2; cur: Vec2 } | null>(
    null
  );

  // ---- responsive sizing ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const scale = PX_PER_M * view.zoom;
  const cx = size.w / 2 + view.panX;
  const cy = size.h / 2 + view.panY;

  // ---- coordinate transforms ----
  const toScreen = useCallback(
    (wx: number, wz: number): [number, number] => [cx + wx * scale, cy + wz * scale],
    [cx, cy, scale]
  );
  const toWorld = useCallback(
    (sx: number, sz: number): Vec2 => ({
      x: (sx - cx) / scale,
      z: (sz - cy) / scale,
    }),
    [cx, cy, scale]
  );

  const maybeSnap = useCallback(
    (v: Vec2): Vec2 =>
      snapEnabled
        ? { x: snapTo(v.x, gridSize), z: snapTo(v.z, gridSize) }
        : v,
    [snapEnabled, gridSize]
  );

  const pointerToWorld = useCallback(
    (e: { clientX: number; clientY: number }): Vec2 => {
      const rect = containerRef.current!.getBoundingClientRect();
      return toWorld(e.clientX - rect.left, e.clientY - rect.top);
    },
    [toWorld]
  );

  // ---- wheel zoom (toward cursor) ----
  const onWheel = useCallback(
    (e: RWheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0014);
        const nz = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        const k = nz / v.zoom;
        // keep the world point under the cursor fixed
        const ncx = mx - (mx - (size.w / 2 + v.panX)) * k;
        const ncy = my - (my - (size.h / 2 + v.panY)) * k;
        return {
          zoom: nz,
          panX: ncx - size.w / 2,
          panY: ncy - size.h / 2,
        };
      });
    },
    [size.w, size.h]
  );

  // ---- pointer handling ----
  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const world = pointerToWorld(e);

      // middle mouse OR pan tool → pan
      if (e.button === 1 || (tool === "pan" && e.button === 0)) {
        gesture.current = {
          kind: "pan",
          startX: e.clientX,
          startY: e.clientY,
          panX: view.panX,
          panY: view.panY,
        };
        return;
      }

      if (e.button !== 0) return;

      if (tool === "wall") {
        const p = maybeSnap(world);
        if (!wallDraft) {
          setWallDraft({ start: p, cur: p });
        } else {
          addWall(wallDraft.start, p);
          setWallDraft({ start: p, cur: p }); // continue polyline
        }
        return;
      }

      // select tool — empty click deselects (furniture handles stop propagation)
      if (tool === "select") {
        select(null);
      }
    },
    [tool, view.panX, view.panY, wallDraft, addWall, maybeSnap, pointerToWorld, select]
  );

  const onPointerMove = useCallback(
    (e: RPointerEvent) => {
      const g = gesture.current;
      if (tool === "wall" && wallDraft) {
        setWallDraft((d) => (d ? { ...d, cur: maybeSnap(pointerToWorld(e)) } : d));
      }
      if (!g) return;

      if (g.kind === "pan") {
        setView((v) => ({
          ...v,
          panX: g.panX + (e.clientX - g.startX),
          panY: g.panY + (e.clientY - g.startY),
        }));
      } else if (g.kind === "moveFurniture") {
        const w = pointerToWorld(e);
        const pos = maybeSnap({ x: w.x - g.grabDX, z: w.z - g.grabDZ });
        const f = useStore.getState().furniture.find((x) => x.id === g.id);
        if (f) moveFurniture(g.id, [pos.x, f.position[1], pos.z]);
      } else if (g.kind === "rotateFurniture") {
        const w = pointerToWorld(e);
        const ang = Math.atan2(w.x - g.cx, -(w.z - g.cz)); // 0 = up (-z)
        rotateFurniture(g.id, ang);
      }
    },
    [tool, wallDraft, maybeSnap, pointerToWorld, moveFurniture, rotateFurniture]
  );

  const endGesture = useCallback((e: RPointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    gesture.current = null;
  }, []);

  // finish wall draft with Escape / right-click / Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") setWallDraft(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- furniture interactions ----
  const startMoveFurniture = (e: RPointerEvent, id: string) => {
    if (tool !== "select") return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    select(id);
    const f = useStore.getState().furniture.find((x) => x.id === id);
    if (!f) return;
    const w = pointerToWorld(e);
    gesture.current = {
      kind: "moveFurniture",
      id,
      grabDX: w.x - f.position[0],
      grabDZ: w.z - f.position[2],
    };
  };

  const startRotateFurniture = (e: RPointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const f = useStore.getState().furniture.find((x) => x.id === id);
    if (!f) return;
    gesture.current = {
      kind: "rotateFurniture",
      id,
      cx: f.position[0],
      cz: f.position[2],
    };
  };

  // ---- drag & drop from catalog ----
  const onDrop = (e: RDragEvent) => {
    e.preventDefault();
    const catalogId = e.dataTransfer.getData("application/x-furniture");
    if (!catalogId) return;
    const w = maybeSnap(pointerToWorld(e));
    addFurniture(catalogId, [w.x, 0, w.z], 0);
  };

  // ---- grid geometry ----
  const gridStep = gridSize * scale;
  const originScreen = toScreen(0, 0);

  // major grid every 1 m
  const majorStep = 1 * scale;

  const cursorClass =
    tool === "pan"
      ? "cursor-grab active:cursor-grabbing"
      : tool === "wall"
      ? "cursor-crosshair"
      : "cursor-default";

  const wallDraftLen = useMemo(() => {
    if (!wallDraft) return 0;
    return Math.hypot(
      wallDraft.cur.x - wallDraft.start.x,
      wallDraft.cur.z - wallDraft.start.z
    );
  }, [wallDraft]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-[#0d1017] no-select ${cursorClass}`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerLeave={endGesture}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onContextMenu={(e) => {
        e.preventDefault();
        setWallDraft(null);
      }}
    >
      <svg width={size.w} height={size.h} className="absolute inset-0">
        <defs>
          <pattern
            id="minorGrid"
            width={gridStep}
            height={gridStep}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${originScreen[0]} ${originScreen[1]})`}
          >
            <path
              d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
              fill="none"
              stroke="#1b2230"
              strokeWidth={1}
            />
          </pattern>
          <pattern
            id="majorGrid"
            width={majorStep}
            height={majorStep}
            patternUnits="userSpaceOnUse"
            patternTransform={`translate(${originScreen[0]} ${originScreen[1]})`}
          >
            <path
              d={`M ${majorStep} 0 L 0 0 0 ${majorStep}`}
              fill="none"
              stroke="#283246"
              strokeWidth={1.25}
            />
          </pattern>
        </defs>

        {showGrid && (
          <>
            <rect width={size.w} height={size.h} fill="url(#minorGrid)" />
            <rect width={size.w} height={size.h} fill="url(#majorGrid)" />
          </>
        )}

        {/* origin axes */}
        <line
          x1={0}
          y1={originScreen[1]}
          x2={size.w}
          y2={originScreen[1]}
          stroke="#3b4a63"
          strokeWidth={1}
          opacity={0.6}
        />
        <line
          x1={originScreen[0]}
          y1={0}
          x2={originScreen[0]}
          y2={size.h}
          stroke="#3b4a63"
          strokeWidth={1}
          opacity={0.6}
        />

        {/* room fill (under walls) — faint fill of wall bounding region */}
        {/* walls */}
        {walls.map((w) => {
          const a = toScreen(w.start.x, w.start.z);
          const b = toScreen(w.end.x, w.end.z);
          const isSel = selectedId === w.id;
          return (
            <g key={w.id}>
              <line
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={isSel ? "#818cf8" : "#cfd6e4"}
                strokeWidth={Math.max(3, WALL_THICKNESS * scale)}
                strokeLinecap="round"
                className="cursor-pointer"
                onPointerDown={(e) => {
                  if (tool !== "select") return;
                  e.stopPropagation();
                  select(w.id);
                }}
              />
              <circle cx={a[0]} cy={a[1]} r={4} fill="#818cf8" />
              <circle cx={b[0]} cy={b[1]} r={4} fill="#818cf8" />
            </g>
          );
        })}

        {/* wall draft ghost */}
        {wallDraft && (
          <>
            <line
              x1={toScreen(wallDraft.start.x, wallDraft.start.z)[0]}
              y1={toScreen(wallDraft.start.x, wallDraft.start.z)[1]}
              x2={toScreen(wallDraft.cur.x, wallDraft.cur.z)[0]}
              y2={toScreen(wallDraft.cur.x, wallDraft.cur.z)[1]}
              stroke="#818cf8"
              strokeWidth={Math.max(3, WALL_THICKNESS * scale)}
              strokeLinecap="round"
              strokeDasharray="6 6"
              opacity={0.9}
            />
            <text
              x={
                (toScreen(wallDraft.start.x, wallDraft.start.z)[0] +
                  toScreen(wallDraft.cur.x, wallDraft.cur.z)[0]) /
                2
              }
              y={
                (toScreen(wallDraft.start.x, wallDraft.start.z)[1] +
                  toScreen(wallDraft.cur.x, wallDraft.cur.z)[1]) /
                  2 -
                8
              }
              fill="#c7d0e0"
              fontSize={12}
              textAnchor="middle"
            >
              {wallDraftLen.toFixed(2)} m
            </text>
          </>
        )}

        {/* furniture */}
        {furniture.map((f) => {
          const item = getItem(f.catalogId);
          if (!item) return null;
          const [px, py] = toScreen(f.position[0], f.position[2]);
          const wpx = item.size[0] * scale;
          const hpx = item.size[1] * scale;
          const deg = (-f.rotation[1] * 180) / Math.PI;
          const isSel = selectedId === f.id;
          return (
            <g
              key={f.id}
              transform={`translate(${px} ${py}) rotate(${deg})`}
              onPointerDown={(e) => startMoveFurniture(e, f.id)}
              className={tool === "select" ? "cursor-move" : "cursor-default"}
            >
              <rect
                x={-wpx / 2}
                y={-hpx / 2}
                width={wpx}
                height={hpx}
                rx={4}
                fill={item.color}
                fillOpacity={0.85}
                stroke={isSel ? "#ffffff" : "#0b0e13"}
                strokeWidth={isSel ? 2 : 1}
              />
              {/* front indicator (toward -z / up) */}
              <line
                x1={0}
                y1={-hpx / 2}
                x2={0}
                y2={-hpx / 2 - Math.min(14, hpx * 0.25)}
                stroke="#ffffff"
                strokeWidth={2}
                opacity={0.7}
              />
              {isSel && (
                <>
                  {/* selection bbox */}
                  <rect
                    x={-wpx / 2 - 4}
                    y={-hpx / 2 - 4}
                    width={wpx + 8}
                    height={hpx + 8}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                  {/* rotate handle */}
                  <line
                    x1={0}
                    y1={-hpx / 2 - 4}
                    x2={0}
                    y2={-hpx / 2 - 28}
                    stroke="#818cf8"
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={0}
                    cy={-hpx / 2 - 32}
                    r={7}
                    fill="#11151c"
                    stroke="#818cf8"
                    strokeWidth={2}
                    className="cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => startRotateFurniture(e, f.id)}
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* HUD */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-black/40 px-2.5 py-1 text-xs text-muted backdrop-blur">
        <span>Zoom {(view.zoom * 100).toFixed(0)}%</span>
        <span className="text-line">|</span>
        <span>Grid {gridSize} m</span>
        <span className="text-line">|</span>
        <span>{snapEnabled ? "Snap on" : "Snap off"}</span>
      </div>
      {tool === "wall" && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-md bg-accent/20 px-3 py-1 text-xs text-accent-2 backdrop-blur">
          Click to place wall points · Esc / right-click to finish
        </div>
      )}
    </div>
  );
}
