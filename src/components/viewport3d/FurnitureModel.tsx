import { Component, Suspense, useMemo, useState, type ReactNode } from "react";
import { useGLTF, useCursor } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { getItem } from "../../data/catalog";
import type { FurnitureItem } from "../../store/useStore";
import PrimitiveModel from "./PrimitiveModels";

/** Catches GLB load failures and renders the primitive fallback instead. */
class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Loads a GLB and auto-fits it to the catalog footprint, sitting on the floor. */
function GLBModel({
  url,
  size,
}: {
  url: string;
  size: [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const fitted = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const dim = new THREE.Vector3();
    box.getSize(dim);
    const scale = Math.min(
      size[0] / (dim.x || 1),
      size[1] / (dim.z || 1),
      size[2] / (dim.y || 1)
    );
    const group = new THREE.Group();
    group.add(clone);
    group.scale.setScalar(scale);
    // re-center on floor after scaling
    const sb = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    sb.getCenter(center);
    clone.position.x -= center.x / scale;
    clone.position.z -= center.z / scale;
    clone.position.y -= sb.min.y / scale;
    return group;
  }, [scene, size]);

  return <primitive object={fitted} />;
}

interface Props {
  item: FurnitureItem;
  selected: boolean;
  onPointerDownItem: (e: ThreeEvent<PointerEvent>, id: string) => void;
}

/** A single placed furniture object: GLB-or-primitive plus selection visuals. */
export default function FurnitureModel({ item, selected, onPointerDownItem }: Props) {
  const def = getItem(item.catalogId);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  if (!def) return null;

  const primitive = (
    <PrimitiveModel kind={def.primitive} size={def.size} color={def.color} />
  );

  return (
    <group
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
      onPointerDown={(e) => onPointerDownItem(e, item.id)}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {def.glb ? (
        <ModelErrorBoundary fallback={primitive}>
          <Suspense fallback={primitive}>
            <GLBModel url={`${import.meta.env.BASE_URL}assets/${def.glb}`} size={def.size} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        primitive
      )}

      {(selected || hovered) && (
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              Math.max(def.size[0], def.size[1]) * 0.62,
              Math.max(def.size[0], def.size[1]) * 0.62 + 0.06,
              48,
            ]}
          />
          <meshBasicMaterial
            color={selected ? "#818cf8" : "#3b4a63"}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}
