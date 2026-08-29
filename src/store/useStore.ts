import { create } from "zustand";
import { getItem } from "../data/catalog";
import { uid } from "../lib/utils";

export type Mode = "2D" | "3D";
export type Tool = "select" | "wall" | "pan";

export interface Vec2 {
  x: number;
  z: number;
}

export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  /** World position in meters [x, y, z]; y is height off the floor. */
  position: [number, number, number];
  /** Euler rotation in radians [rx, ry, rz]. */
  rotation: [number, number, number];
  scale: number;
}

/** Wall height for 3D extrusion, in meters. */
export const WALL_HEIGHT = 2.8;
export const WALL_THICKNESS = 0.12;

/** Above this width the panels dock beside the viewport; below it they become drawers. */
export const DESKTOP_QUERY = "(min-width: 1024px)";

const isDesktopNow = () =>
  typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches;

interface StoreState {
  // ---- view ----
  mode: Mode;
  tool: Tool;
  gridSize: number; // snap step in meters
  snapEnabled: boolean;
  showGrid: boolean;

  // ---- panel layout ----
  sidebarOpen: boolean;
  propertiesOpen: boolean;
  /** Mirrors DESKTOP_QUERY, kept here so actions can branch on the breakpoint. */
  isDesktop: boolean;

  // ---- scene data ----
  walls: Wall[];
  furniture: FurnitureItem[];
  selectedId: string | null;

  // ---- view actions ----
  setMode: (m: Mode) => void;
  setTool: (t: Tool) => void;
  toggleSnap: () => void;
  toggleGrid: () => void;

  // ---- panel actions ----
  toggleSidebar: () => void;
  toggleProperties: () => void;
  closePanels: () => void;
  syncPanelsToViewport: (isDesktop: boolean) => void;

  // ---- wall actions ----
  addWall: (start: Vec2, end: Vec2) => string;
  updateWall: (id: string, patch: Partial<Pick<Wall, "start" | "end">>) => void;
  removeWall: (id: string) => void;

  // ---- furniture actions ----
  addFurniture: (
    catalogId: string,
    position: [number, number, number],
    rotationY?: number
  ) => string | null;
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void;
  moveFurniture: (id: string, position: [number, number, number]) => void;
  rotateFurniture: (id: string, ry: number) => void;
  nudgeRotation: (id: string, deltaY: number) => void;

  // ---- selection / lifecycle ----
  select: (id: string | null) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  clearScene: () => void;
  loadSample: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  mode: "2D",
  tool: "select",
  gridSize: 0.25,
  snapEnabled: true,
  showGrid: true,

  sidebarOpen: isDesktopNow(),
  propertiesOpen: isDesktopNow(),
  isDesktop: isDesktopNow(),

  walls: [],
  furniture: [],
  selectedId: null,

  setMode: (mode) => set({ mode }),
  setTool: (tool) => set({ tool, selectedId: null }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleProperties: () => set((s) => ({ propertiesOpen: !s.propertiesOpen })),
  closePanels: () => set({ sidebarOpen: false, propertiesOpen: false }),
  syncPanelsToViewport: (isDesktop) =>
    set((s) =>
      s.isDesktop === isDesktop
        ? { isDesktop }
        : // Only reset the panels when the breakpoint actually flips, so a
          // deliberate collapse survives ordinary resizing: docked open on
          // desktop, dismissed on mobile to leave the viewport full-bleed.
          { isDesktop, sidebarOpen: isDesktop, propertiesOpen: isDesktop }
    ),

  addWall: (start, end) => {
    const id = uid("wall");
    set((s) => ({ walls: [...s.walls, { id, start, end }] }));
    return id;
  },
  updateWall: (id, patch) =>
    set((s) => ({
      walls: s.walls.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    })),
  removeWall: (id) =>
    set((s) => ({
      walls: s.walls.filter((w) => w.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  addFurniture: (catalogId, position, rotationY = 0) => {
    const item = getItem(catalogId);
    if (!item) return null;
    const id = uid("furn");
    const f: FurnitureItem = {
      id,
      catalogId,
      position,
      rotation: [0, rotationY, 0],
      scale: 1,
    };
    set((s) => ({ furniture: [...s.furniture, f], selectedId: id }));
    return id;
  },
  updateFurniture: (id, patch) =>
    set((s) => ({
      furniture: s.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })),
  moveFurniture: (id, position) =>
    set((s) => ({
      furniture: s.furniture.map((f) => (f.id === id ? { ...f, position } : f)),
    })),
  rotateFurniture: (id, ry) =>
    set((s) => ({
      furniture: s.furniture.map((f) =>
        f.id === id ? { ...f, rotation: [f.rotation[0], ry, f.rotation[2]] } : f
      ),
    })),
  nudgeRotation: (id, deltaY) =>
    set((s) => ({
      furniture: s.furniture.map((f) =>
        f.id === id
          ? { ...f, rotation: [f.rotation[0], f.rotation[1] + deltaY, f.rotation[2]] }
          : f
      ),
    })),

  select: (id) => set({ selectedId: id }),
  removeSelected: () => {
    const id = get().selectedId;
    if (!id) return;
    set((s) => ({
      walls: s.walls.filter((w) => w.id !== id),
      furniture: s.furniture.filter((f) => f.id !== id),
      selectedId: null,
    }));
  },
  duplicateSelected: () => {
    const { selectedId, furniture } = get();
    const src = furniture.find((f) => f.id === selectedId);
    if (!src) return;
    const id = uid("furn");
    const copy: FurnitureItem = {
      ...src,
      id,
      position: [src.position[0] + 0.4, src.position[1], src.position[2] + 0.4],
    };
    set((s) => ({ furniture: [...s.furniture, copy], selectedId: id }));
  },
  clearScene: () => set({ walls: [], furniture: [], selectedId: null }),

  loadSample: () => {
    // A simple 6m x 4.5m room with a starter furniture set.
    const W = 6;
    const D = 4.5;
    const x0 = -W / 2;
    const x1 = W / 2;
    const z0 = -D / 2;
    const z1 = D / 2;
    const walls: Wall[] = [
      { id: uid("wall"), start: { x: x0, z: z0 }, end: { x: x1, z: z0 } },
      { id: uid("wall"), start: { x: x1, z: z0 }, end: { x: x1, z: z1 } },
      { id: uid("wall"), start: { x: x1, z: z1 }, end: { x: x0, z: z1 } },
      { id: uid("wall"), start: { x: x0, z: z1 }, end: { x: x0, z: z0 } },
    ];
    const mk = (
      catalogId: string,
      x: number,
      z: number,
      ry = 0
    ): FurnitureItem => ({
      id: uid("furn"),
      catalogId,
      position: [x, 0, z],
      rotation: [0, ry, 0],
      scale: 1,
    });
    const furniture: FurnitureItem[] = [
      mk("rug", 0, 0.4),
      mk("sofa", 0, 1.4, Math.PI),
      mk("coffee-table", 0, 0.4),
      mk("tv-unit", 0, -1.7, 0),
      mk("armchair", -2, 0.2, Math.PI / 2.4),
      mk("plant", 2.4, -1.5),
      mk("floor-lamp", -2.3, 1.6),
    ];
    set({ walls, furniture, selectedId: null });
  },
}));
