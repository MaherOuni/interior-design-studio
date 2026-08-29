import { useState, type DragEvent } from "react";
import {
  Sofa,
  Armchair,
  Table,
  BedDouble,
  Flower2,
  ChevronDown,
  Lamp,
  Tv,
  Box as BoxIcon,
} from "lucide-react";
import { CATALOG, CATEGORIES, type Category, type CatalogItem } from "../../data/catalog";
import { useStore } from "../../store/useStore";

const CATEGORY_ICON: Record<Category, React.ReactNode> = {
  Seating: <Sofa size={15} />,
  Tables: <Table size={15} />,
  Beds: <BedDouble size={15} />,
  Decor: <Flower2 size={15} />,
};

function itemIcon(item: CatalogItem) {
  switch (item.primitive) {
    case "sofa":
      return <Sofa size={18} />;
    case "armchair":
    case "diningChair":
      return <Armchair size={18} />;
    case "coffeeTable":
    case "diningTable":
    case "sideTable":
    case "nightstand":
      return <Table size={18} />;
    case "bed":
      return <BedDouble size={18} />;
    case "plant":
      return <Flower2 size={18} />;
    case "lamp":
      return <Lamp size={18} />;
    case "tv":
      return <Tv size={18} />;
    default:
      return <BoxIcon size={18} />;
  }
}

function CatalogCard({ item }: { item: CatalogItem }) {
  const addFurniture = useStore((s) => s.addFurniture);

  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("application/x-furniture", item.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onDoubleClick={() => addFurniture(item.id, [0, 0, 0], 0)}
      title={`${item.name} — drag into the scene (or double-click)`}
      className="group flex w-full items-center gap-3 rounded-lg border border-line/70 bg-panel-3/60 px-3 py-2 text-left transition hover:border-accent/60 hover:bg-panel-3 active:scale-[0.98]"
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
        style={{ background: item.color + "22", color: item.color }}
      >
        {itemIcon(item)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
        <span className="block text-[11px] text-muted">
          {item.size[0]}×{item.size[1]} m
        </span>
      </span>
    </button>
  );
}

function Section({ category }: { category: Category }) {
  const [open, setOpen] = useState(true);
  const items = CATALOG.filter((i) => i.category === category);
  return (
    <div className="border-b border-line/50 pb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-1 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
      >
        <span className="flex items-center gap-2">
          {CATEGORY_ICON[category]}
          {category}
          <span className="text-[10px] text-line">({items.length})</span>
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 pb-2">
          {items.map((i) => (
            <CatalogCard key={i.id} item={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-panel">
      <div className="px-4 pb-2 pt-4">
        <h2 className="text-sm font-semibold text-ink">Furniture Catalog</h2>
        <p className="mt-0.5 text-[11px] text-muted">
          Drag an item into the 2D or 3D view
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {CATEGORIES.map((c) => (
          <Section key={c} category={c} />
        ))}
      </div>
    </aside>
  );
}
