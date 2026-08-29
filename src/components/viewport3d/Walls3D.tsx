import * as THREE from "three";
import { useStore, WALL_HEIGHT, WALL_THICKNESS } from "../../store/useStore";

/**
 * Extrudes each 2D wall segment into a 3D box of WALL_HEIGHT, aligned to the
 * segment direction. Reads live from the shared store so 2D edits appear in 3D.
 *
 * Walls render with `THREE.BackSide` so the faces pointing at the camera are
 * culled — this gives a "dollhouse" view where the near walls disappear and you
 * always see *into* the room from any orbit angle. They are also non-interactive
 * in 3D (`raycast` disabled): walls are selected/edited in the 2D plan, and
 * skipping their raycast lets clicks reach the furniture inside the room.
 */
export default function Walls3D() {
  const walls = useStore((s) => s.walls);
  const selectedId = useStore((s) => s.selectedId);

  return (
    <group>
      {walls.map((w) => {
        const dx = w.end.x - w.start.x;
        const dz = w.end.z - w.start.z;
        const len = Math.hypot(dx, dz);
        if (len < 1e-3) return null;
        const cx = (w.start.x + w.end.x) / 2;
        const cz = (w.start.z + w.end.z) / 2;
        // rotation-y so the box's +x axis follows (dx,dz)
        const ry = Math.atan2(-dz, dx);
        const isSel = selectedId === w.id;
        return (
          <mesh
            key={w.id}
            position={[cx, WALL_HEIGHT / 2, cz]}
            rotation={[0, ry, 0]}
            castShadow
            receiveShadow
            raycast={() => null}
          >
            <boxGeometry args={[len + WALL_THICKNESS, WALL_HEIGHT, WALL_THICKNESS]} />
            <meshStandardMaterial
              color={isSel ? "#cdd6ff" : "#e7e9ef"}
              roughness={0.92}
              metalness={0}
              side={THREE.BackSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}
