/**
 * Furniture catalog.
 *
 * Each item carries a footprint (in meters) used by both the 2D blueprint
 * renderer and the low-poly 3D primitive fallback, plus an optional `glb`
 * path. If a GLB file exists at `/assets/<glb>` it is loaded via useGLTF;
 * otherwise the app renders a stylized primitive model of the same footprint.
 */

export type Category = "Seating" | "Tables" | "Beds" | "Decor";

export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  /** Footprint + height in meters: width (x), depth (z), height (y). */
  size: [number, number, number];
  /** Base color for the primitive fallback + 2D swatch. */
  color: string;
  /** Optional GLB filename inside /public/assets. */
  glb?: string;
  /** Which stylized primitive model to draw when no GLB is present. */
  primitive: PrimitiveKind;
}

export type PrimitiveKind =
  | "sofa"
  | "armchair"
  | "diningChair"
  | "coffeeTable"
  | "diningTable"
  | "sideTable"
  | "bed"
  | "nightstand"
  | "plant"
  | "lamp"
  | "rug"
  | "tv";

export const CATALOG: CatalogItem[] = [
  // Seating
  {
    id: "sofa",
    name: "Modern Sofa",
    category: "Seating",
    size: [2.1, 0.9, 0.8],
    color: "#6b7a99",
    primitive: "sofa",
  },
  {
    id: "armchair",
    name: "Lounge Chair",
    category: "Seating",
    size: [0.85, 0.85, 0.85],
    color: "#8d6e63",
    primitive: "armchair",
  },
  {
    id: "dining-chair",
    name: "Dining Chair",
    category: "Seating",
    size: [0.5, 0.55, 0.95],
    color: "#9e9e9e",
    // Real CC0 glTF sample asset, downloaded by the asset pipeline.
    glb: "SheenChair.glb",
    primitive: "diningChair",
  },
  // Tables
  {
    id: "coffee-table",
    name: "Coffee Table",
    category: "Tables",
    size: [1.1, 0.45, 0.4],
    color: "#5d4037",
    primitive: "coffeeTable",
  },
  {
    id: "dining-table",
    name: "Dining Table",
    category: "Tables",
    size: [1.6, 1.0, 0.75],
    color: "#6d4c41",
    primitive: "diningTable",
  },
  {
    id: "side-table",
    name: "Side Table",
    category: "Tables",
    size: [0.5, 0.5, 0.55],
    color: "#795548",
    primitive: "sideTable",
  },
  // Beds
  {
    id: "bed",
    name: "Queen Bed",
    category: "Beds",
    size: [1.6, 2.05, 0.6],
    color: "#90a4ae",
    primitive: "bed",
  },
  {
    id: "nightstand",
    name: "Nightstand",
    category: "Beds",
    size: [0.5, 0.4, 0.55],
    color: "#78909c",
    primitive: "nightstand",
  },
  // Decor
  {
    id: "plant",
    name: "Potted Plant",
    category: "Decor",
    size: [0.5, 0.5, 1.3],
    color: "#43a047",
    primitive: "plant",
  },
  {
    id: "floor-lamp",
    name: "Floor Lamp",
    category: "Decor",
    size: [0.4, 0.4, 1.6],
    color: "#fbc02d",
    primitive: "lamp",
  },
  {
    id: "rug",
    name: "Area Rug",
    category: "Decor",
    size: [2.4, 1.6, 0.02],
    color: "#b08968",
    primitive: "rug",
  },
  {
    id: "tv-unit",
    name: "TV Console",
    category: "Decor",
    size: [1.8, 0.4, 0.5],
    color: "#37474f",
    primitive: "tv",
  },
];

export const CATEGORIES: Category[] = ["Seating", "Tables", "Beds", "Decor"];

const byId = new Map(CATALOG.map((c) => [c.id, c]));
export function getItem(id: string): CatalogItem | undefined {
  return byId.get(id);
}
