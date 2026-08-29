import { type PrimitiveKind } from "../../data/catalog";

/**
 * Stylized low-poly furniture built from primitives. These render instantly
 * with no network dependency and act as the guaranteed fallback whenever a
 * GLB asset is missing or fails to load.
 *
 * Convention: the group origin sits on the floor at the item's center, the
 * footprint spans size[0] (x) by size[1] (z), and the model "faces" -Z.
 */

const WOOD = "#4a382c";
const METAL = "#9aa3b2";
const DARK = "#222831";

interface Props {
  kind: PrimitiveKind;
  size: [number, number, number];
  color: string;
}

function Box({
  args,
  position,
  color,
  rough = 0.7,
  metal = 0.05,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  rough?: number;
  metal?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

export default function PrimitiveModel({ kind, size, color }: Props) {
  const [w, d, h] = size;

  switch (kind) {
    case "sofa":
    case "armchair": {
      const seatH = 0.4;
      const armW = 0.16;
      const backT = 0.16;
      return (
        <group>
          <Box args={[w, seatH, d]} position={[0, seatH / 2, 0]} color={color} />
          {/* cushions */}
          <Box
            args={[w - armW * 2, 0.16, d - backT]}
            position={[0, seatH + 0.08, backT / 2]}
            color={color}
          />
          {/* backrest at +z */}
          <Box
            args={[w, h - seatH, backT]}
            position={[0, (h + seatH) / 2, d / 2 - backT / 2]}
            color={color}
          />
          {/* arms */}
          <Box
            args={[armW, h - seatH + 0.1, d]}
            position={[-w / 2 + armW / 2, seatH + (h - seatH) / 2 - 0.05, 0]}
            color={color}
          />
          <Box
            args={[armW, h - seatH + 0.1, d]}
            position={[w / 2 - armW / 2, seatH + (h - seatH) / 2 - 0.05, 0]}
            color={color}
          />
        </group>
      );
    }

    case "diningChair": {
      const seatH = 0.46;
      const t = 0.05;
      const leg = 0.05;
      const lx = w / 2 - leg;
      const lz = d / 2 - leg;
      return (
        <group>
          <Box args={[w, t, d]} position={[0, seatH, 0]} color={color} />
          <Box
            args={[w, h - seatH, t]}
            position={[0, (h + seatH) / 2, d / 2 - t / 2]}
            color={color}
          />
          {[
            [-lx, lz],
            [lx, lz],
            [-lx, -lz],
            [lx, -lz],
          ].map(([x, z], i) => (
            <Box
              key={i}
              args={[leg, seatH, leg]}
              position={[x, seatH / 2, z]}
              color={WOOD}
            />
          ))}
        </group>
      );
    }

    case "coffeeTable":
    case "diningTable":
    case "sideTable":
    case "nightstand": {
      const topT = 0.06;
      const leg = 0.06;
      const lx = w / 2 - leg;
      const lz = d / 2 - leg;
      const woodTone = kind === "nightstand" ? color : WOOD;
      return (
        <group>
          <Box
            args={[w, topT, d]}
            position={[0, h - topT / 2, 0]}
            color={kind === "nightstand" ? color : color}
          />
          {kind === "nightstand" ? (
            <Box args={[w, h - topT, d]} position={[0, (h - topT) / 2, 0]} color={color} />
          ) : (
            [
              [-lx, lz],
              [lx, lz],
              [-lx, -lz],
              [lx, -lz],
            ].map(([x, z], i) => (
              <Box
                key={i}
                args={[leg, h - topT, leg]}
                position={[x, (h - topT) / 2, z]}
                color={woodTone}
              />
            ))
          )}
        </group>
      );
    }

    case "bed": {
      const frameH = 0.3;
      const mattH = 0.28;
      const headH = 0.95;
      return (
        <group>
          {/* frame */}
          <Box args={[w, frameH, d]} position={[0, frameH / 2, 0]} color={WOOD} />
          {/* mattress */}
          <Box
            args={[w - 0.08, mattH, d - 0.08]}
            position={[0, frameH + mattH / 2, 0]}
            color="#e8eaf0"
          />
          {/* duvet */}
          <Box
            args={[w - 0.06, 0.1, d * 0.6]}
            position={[0, frameH + mattH + 0.02, d * 0.18]}
            color={color}
          />
          {/* pillows */}
          <Box
            args={[w * 0.4, 0.12, 0.32]}
            position={[-w * 0.22, frameH + mattH + 0.05, -d / 2 + 0.32]}
            color="#f4f6fa"
          />
          <Box
            args={[w * 0.4, 0.12, 0.32]}
            position={[w * 0.22, frameH + mattH + 0.05, -d / 2 + 0.32]}
            color="#f4f6fa"
          />
          {/* headboard at -z */}
          <Box
            args={[w, headH, 0.1]}
            position={[0, headH / 2, -d / 2 + 0.05]}
            color={WOOD}
          />
        </group>
      );
    }

    case "plant": {
      const potH = 0.35;
      return (
        <group>
          <mesh position={[0, potH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.18, 0.14, potH, 16]} />
            <meshStandardMaterial color="#b5651d" roughness={0.8} />
          </mesh>
          <mesh position={[0, potH + (h - potH) * 0.55, 0]} castShadow>
            <sphereGeometry args={[(h - potH) * 0.5, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          <mesh position={[0.12, potH + (h - potH) * 0.35, -0.05]} castShadow>
            <sphereGeometry args={[(h - potH) * 0.32, 10, 10]} />
            <meshStandardMaterial color="#2e7d32" roughness={0.9} />
          </mesh>
        </group>
      );
    }

    case "lamp": {
      const baseH = 0.05;
      const shadeH = 0.28;
      return (
        <group>
          <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.16, 0.18, baseH, 20]} />
            <meshStandardMaterial color={DARK} metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0, (h - shadeH) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, h - shadeH, 8]} />
            <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, h - shadeH / 2, 0]} castShadow>
            <coneGeometry args={[0.22, shadeH, 20, 1, true]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.35}
              roughness={0.6}
              side={2}
            />
          </mesh>
          <pointLight
            position={[0, h - shadeH, 0]}
            intensity={6}
            distance={4}
            color="#ffe9c2"
          />
        </group>
      );
    }

    case "rug": {
      return (
        <mesh position={[0, 0.012, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      );
    }

    case "tv": {
      const consoleH = h;
      return (
        <group>
          <Box args={[w, consoleH, d]} position={[0, consoleH / 2, 0]} color={color} />
          {/* screen standing on console, facing -z */}
          <Box
            args={[w * 0.8, 0.6, 0.05]}
            position={[0, consoleH + 0.4, -d / 2 + 0.1]}
            color="#0c0f15"
          />
          <mesh position={[0, consoleH + 0.4, -d / 2 + 0.07]} castShadow>
            <planeGeometry args={[w * 0.74, 0.5]} />
            <meshStandardMaterial
              color="#10203a"
              emissive="#16314f"
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
        </group>
      );
    }

    default:
      return (
        <Box args={[w, h, d]} position={[0, h / 2, 0]} color={color} />
      );
  }
}
