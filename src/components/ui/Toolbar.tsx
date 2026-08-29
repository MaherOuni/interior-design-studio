import {
  MousePointer2,
  Pencil,
  Hand,
  Grid3x3,
  Magnet,
  Trash2,
  Sparkles,
  LayoutGrid,
  Box,
} from "lucide-react";
import { useStore, type Tool } from "../../store/useStore";
import { cn } from "../../lib/utils";

function IconButton({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-md text-muted transition",
        "hover:bg-panel-3 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent",
        active && "bg-accent text-white hover:bg-accent hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

export default function Toolbar() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const snapEnabled = useStore((s) => s.snapEnabled);
  const toggleSnap = useStore((s) => s.toggleSnap);
  const showGrid = useStore((s) => s.showGrid);
  const toggleGrid = useStore((s) => s.toggleGrid);
  const clearScene = useStore((s) => s.clearScene);
  const loadSample = useStore((s) => s.loadSample);

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <MousePointer2 size={17} />, label: "Select / Move (V)" },
    { id: "wall", icon: <Pencil size={17} />, label: "Draw Walls (W)" },
    { id: "pan", icon: <Hand size={17} />, label: "Pan (Space)" },
  ];

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel px-4">
      {/* brand */}
      <div className="flex items-center gap-2 pr-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 text-white">
          <LayoutGrid size={17} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">Interior Studio</div>
          <div className="text-[10px] text-muted">2D / 3D Room Planner</div>
        </div>
      </div>

      <div className="h-7 w-px bg-line" />

      {/* 2D-only drawing tools */}
      <div
        className={cn(
          "flex items-center gap-1 transition-opacity",
          mode === "3D" && "pointer-events-none opacity-30"
        )}
      >
        {tools.map((t) => (
          <IconButton
            key={t.id}
            title={t.label}
            active={tool === t.id}
            onClick={() => setTool(t.id)}
          >
            {t.icon}
          </IconButton>
        ))}
      </div>

      <div className="h-7 w-px bg-line" />

      <IconButton title="Snap to grid" active={snapEnabled} onClick={toggleSnap}>
        <Magnet size={17} />
      </IconButton>
      <IconButton title="Toggle grid" active={showGrid} onClick={toggleGrid}>
        <Grid3x3 size={17} />
      </IconButton>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={loadSample}
          title="Load a sample room"
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs text-muted transition hover:border-accent/60 hover:text-ink"
        >
          <Sparkles size={14} /> Sample
        </button>
        <button
          onClick={clearScene}
          title="Clear everything"
          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs text-muted transition hover:border-red-500/60 hover:text-red-300"
        >
          <Trash2 size={14} /> Clear
        </button>

        {/* 2D / 3D segmented toggle */}
        <div className="relative ml-1 flex rounded-lg border border-line bg-panel-2 p-0.5">
          <div
            className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-md bg-accent transition-transform duration-300 ease-out"
            style={{ transform: mode === "3D" ? "translateX(100%)" : "translateX(0)" }}
          />
          <button
            onClick={() => setMode("2D")}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
              mode === "2D" ? "text-white" : "text-muted hover:text-ink"
            )}
          >
            <LayoutGrid size={14} /> 2D
          </button>
          <button
            onClick={() => setMode("3D")}
            className={cn(
              "relative z-10 flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors",
              mode === "3D" ? "text-white" : "text-muted hover:text-ink"
            )}
          >
            <Box size={14} /> 3D
          </button>
        </div>
      </div>
    </header>
  );
}
