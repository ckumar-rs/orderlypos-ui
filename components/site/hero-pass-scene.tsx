"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";

/** Soft brand orbs — edges only, never the reading column. */
function Orb({
  position,
  scale,
  color,
  speed,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.position.y = position[1] + Math.sin(t) * 0.12;
    ref.current.rotation.y = t * 0.15;
  });

  return (
    <Float speed={0.6} rotationIntensity={0.2} floatIntensity={0.35}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          roughness={0.45}
          metalness={0.05}
          transparent
          opacity={0.35}
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const orbs = useMemo(
    () =>
      [
        { position: [-3.6, 0.8, -1.2] as [number, number, number], scale: 0.55, color: "#F2651B", speed: 0.55 },
        { position: [-3.1, -0.9, -0.6] as [number, number, number], scale: 0.35, color: "#FFB48A", speed: 0.7 },
        { position: [3.5, 0.6, -1] as [number, number, number], scale: 0.5, color: "#F2651B", speed: 0.45 },
        { position: [3.2, -1.1, -0.4] as [number, number, number], scale: 0.28, color: "#EDE6E0", speed: 0.8 },
        { position: [-2.4, 1.6, -1.8] as [number, number, number], scale: 0.22, color: "#FFF1E6", speed: 0.65 },
        { position: [2.6, 1.5, -1.6] as [number, number, number], scale: 0.2, color: "#FFB48A", speed: 0.5 },
      ] as const,
    [],
  );

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 2]} intensity={0.7} color="#FFF7F0" />
      <directionalLight position={[-4, 1, -2]} intensity={0.25} color="#F2651B" />
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} />
      ))}
    </>
  );
}

export function HeroPassScene() {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.25]}
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
      style={{ background: "transparent" }}
    >
      <Scene />
    </Canvas>
  );
}
