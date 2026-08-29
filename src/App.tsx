import { useEffect } from "react";
import Toolbar from "./components/ui/Toolbar";
import Sidebar from "./components/ui/Sidebar";
import PropertiesPanel from "./components/ui/PropertiesPanel";
import Viewport2D from "./components/viewport2d/Viewport2D";
import Viewport3D from "./components/viewport3d/Viewport3D";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { DESKTOP_QUERY, useStore } from "./store/useStore";

export default function App() {
  const mode = useStore((s) => s.mode);
  const setTool = useStore((s) => s.setTool);
  const removeSelected = useStore((s) => s.removeSelected);
  const loadSample = useStore((s) => s.loadSample);
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const propertiesOpen = useStore((s) => s.propertiesOpen);
  const closePanels = useStore((s) => s.closePanels);
  const isDraggingCatalogItem = useStore((s) => s.isDraggingCatalogItem);
  const syncPanelsToViewport = useStore((s) => s.syncPanelsToViewport);

  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  // seed a sample room on first load
  useEffect(() => {
    loadSample();
  }, [loadSample]);

  // keep panel state in step with the breakpoint
  useEffect(() => {
    syncPanelsToViewport(isDesktop);
  }, [isDesktop, syncPanelsToViewport]);

  // global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "v") setTool("select");
      if (e.key === "w") setTool("wall");
      if (e.key === "Delete" || e.key === "Backspace") removeSelected();
      if (e.key === "Escape") closePanels();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTool, removeSelected, closePanels]);

  const is2D = mode === "2D";
  // Below the breakpoint the panels float above the viewport, so an open one
  // needs a scrim to catch the dismissing tap. It has to yield during a catalog
  // drag though, or it intercepts the drop meant for the canvas underneath.
  const showScrim =
    !isDesktop && (sidebarOpen || propertiesOpen) && !isDraggingCatalogItem;

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#0b0e13]">
      <Toolbar />
      {/* `relative` anchors the drawer positioning of both panels */}
      <div className="relative flex min-h-0 flex-1">
        <Sidebar />

        {/* viewport stack — both mounted, crossfaded for smooth transitions.
            `inert` on the hidden layer is essential: the R3F <canvas> forces
            pointer-events:auto on itself, which overrides a parent's
            pointer-events:none and would otherwise let the invisible 3D canvas
            swallow every click meant for the 2D view. inert removes the whole
            subtree from hit-testing (and focus). */}
        <main className="relative min-w-0 flex-1">
          <div
            className="absolute inset-0 transition-all duration-500 ease-out"
            inert={!is2D}
            style={{
              opacity: is2D ? 1 : 0,
              transform: is2D ? "scale(1)" : "scale(1.02)",
            }}
          >
            <Viewport2D />
          </div>
          <div
            className="absolute inset-0 transition-all duration-500 ease-out"
            inert={is2D}
            style={{
              opacity: is2D ? 0 : 1,
              transform: is2D ? "scale(0.98)" : "scale(1)",
            }}
          >
            <Viewport3D active={!is2D} />
          </div>
        </main>

        <div
          onClick={closePanels}
          aria-hidden
          className={`absolute inset-0 z-20 bg-black/60 transition-opacity duration-300 lg:hidden ${
            showScrim ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />

        <PropertiesPanel />
      </div>
    </div>
  );
}
