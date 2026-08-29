import { Grid } from "@react-three/drei";
import { useStore } from "../../store/useStore";

/** Ground plane + reference grid for the 3D scene. */
export default function Floor() {
  const showGrid = useStore((s) => s.showGrid);
  const select = useStore((s) => s.select);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={() => select(null)}
      >
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#161b22" roughness={1} metalness={0} />
      </mesh>

      {showGrid && (
        <Grid
          position={[0, 0.002, 0]}
          args={[60, 60]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#222b38"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#33405a"
          fadeDistance={36}
          fadeStrength={1.5}
          followCamera={false}
          infiniteGrid
        />
      )}
    </group>
  );
}
