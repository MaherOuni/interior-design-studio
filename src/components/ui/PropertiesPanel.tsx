import { RotateCcw, RotateCw, Copy, Trash2, MousePointerClick } from "lucide-react";
import { useStore } from "../../store/useStore";
import { getItem } from "../../data/catalog";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function NumberField({
  value,
  onChange,
  step = 0.1,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center rounded-md border border-line bg-panel-2 px-2">
      <input
        type="number"
        value={Number(value.toFixed(2))}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-16 bg-transparent py-1 text-right text-xs text-ink outline-none"
      />
      {suffix && <span className="pl-1 text-[10px] text-muted">{suffix}</span>}
    </div>
  );
}

export default function PropertiesPanel() {
  const selectedId = useStore((s) => s.selectedId);
  const furniture = useStore((s) => s.furniture);
  const walls = useStore((s) => s.walls);
  const updateFurniture = useStore((s) => s.updateFurniture);
  const moveFurniture = useStore((s) => s.moveFurniture);
  const nudgeRotation = useStore((s) => s.nudgeRotation);
  const rotateFurniture = useStore((s) => s.rotateFurniture);
  const duplicateSelected = useStore((s) => s.duplicateSelected);
  const removeSelected = useStore((s) => s.removeSelected);

  const furn = furniture.find((f) => f.id === selectedId);
  const wall = walls.find((w) => w.id === selectedId);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-line bg-panel">
      <div className="border-b border-line px-4 py-3.5">
        <h2 className="text-sm font-semibold text-ink">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!furn && !wall && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-muted">
            <MousePointerClick size={28} className="opacity-50" />
            <p className="text-xs leading-relaxed">
              Select an item in the scene to edit its position, rotation, and size.
            </p>
          </div>
        )}

        {furn &&
          (() => {
            const def = getItem(furn.catalogId)!;
            const degrees = (furn.rotation[1] * 180) / Math.PI;
            return (
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="h-10 w-10 shrink-0 rounded-lg"
                    style={{ background: def.color }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink">
                      {def.name}
                    </div>
                    <div className="text-[11px] text-muted">{def.category}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-line/60 bg-panel-2/40 px-3 py-1">
                  <Row label="Position X">
                    <NumberField
                      value={furn.position[0]}
                      onChange={(v) =>
                        moveFurniture(furn.id, [v, furn.position[1], furn.position[2]])
                      }
                      suffix="m"
                    />
                  </Row>
                  <Row label="Position Z">
                    <NumberField
                      value={furn.position[2]}
                      onChange={(v) =>
                        moveFurniture(furn.id, [furn.position[0], furn.position[1], v])
                      }
                      suffix="m"
                    />
                  </Row>
                  <Row label="Rotation">
                    <NumberField
                      value={((degrees % 360) + 360) % 360}
                      step={5}
                      onChange={(v) => rotateFurniture(furn.id, (v * Math.PI) / 180)}
                      suffix="°"
                    />
                  </Row>
                  <Row label="Scale">
                    <NumberField
                      value={furn.scale}
                      step={0.05}
                      onChange={(v) =>
                        updateFurniture(furn.id, { scale: Math.max(0.2, v) })
                      }
                      suffix="×"
                    />
                  </Row>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => nudgeRotation(furn.id, -Math.PI / 12)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-2 text-xs text-muted hover:text-ink"
                  >
                    <RotateCcw size={14} /> -15°
                  </button>
                  <button
                    onClick={() => nudgeRotation(furn.id, Math.PI / 12)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-2 text-xs text-muted hover:text-ink"
                  >
                    <RotateCw size={14} /> +15°
                  </button>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={duplicateSelected}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-2 text-xs text-muted hover:border-accent/60 hover:text-ink"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    onClick={removeSelected}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line py-2 text-xs text-red-300/80 hover:border-red-500/60 hover:text-red-300"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })()}

        {wall && (
          <div>
            <div className="mb-3 text-sm font-medium text-ink">Wall Segment</div>
            <div className="rounded-lg border border-line/60 bg-panel-2/40 px-3 py-2 text-xs text-muted">
              <div className="flex justify-between py-1">
                <span>Length</span>
                <span className="text-ink">
                  {Math.hypot(
                    wall.end.x - wall.start.x,
                    wall.end.z - wall.start.z
                  ).toFixed(2)}{" "}
                  m
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Start</span>
                <span className="text-ink">
                  {wall.start.x.toFixed(1)}, {wall.start.z.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>End</span>
                <span className="text-ink">
                  {wall.end.x.toFixed(1)}, {wall.end.z.toFixed(1)}
                </span>
              </div>
            </div>
            <button
              onClick={removeSelected}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-line py-2 text-xs text-red-300/80 hover:border-red-500/60 hover:text-red-300"
            >
              <Trash2 size={14} /> Delete Wall
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
