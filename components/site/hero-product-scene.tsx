"use client";

import { ContactShadows, Float, RoundedBox, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import * as THREE from "three";

function ScreenFace({
  src,
  width,
  height,
  radius = 0.07,
}: {
  src: string;
  width: number;
  height: number;
  radius?: number;
}) {
  const texture = useTexture(src);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  const depth = 0.08;
  return (
    <group>
      <RoundedBox args={[width + 0.1, height + 0.1, depth]} radius={radius} smoothness={4}>
        <meshStandardMaterial color="#141414" roughness={0.32} metalness={0.42} />
      </RoundedBox>
      {/* Soft brand rim on the bezel edge */}
      <mesh position={[0, 0, -depth / 2 - 0.001]}>
        <planeGeometry args={[width + 0.14, height + 0.14]} />
        <meshBasicMaterial color="#F2651B" transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0, depth / 2 + 0.0015]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SoftGlow() {
  const mesh = useRef<Mesh>(null);
  useFrame((state) => {
    if (!mesh.current) return;
    const mat = mesh.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 0.9) * 0.04;
  });
  return (
    <mesh ref={mesh} position={[0.2, -0.2, -1.2]} rotation={[-0.2, 0.2, 0]}>
      <planeGeometry args={[3.4, 3.4]} />
      <meshBasicMaterial color="#F2651B" transparent opacity={0.22} depthWrite={false} />
    </mesh>
  );
}

/** One outstanding 3D composition: hero till + depth card of the kitchen pass. */
function HeroRig({
  primarySrc,
  secondarySrc,
}: {
  primarySrc: string;
  secondarySrc: string;
}) {
  const root = useRef<Group>(null);
  const mouse = useMemo(() => ({ x: 0, y: 0 }), []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      mouse.x = x;
      mouse.y = y;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mouse]);

  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    const targetY = -0.18 + mouse.x * 0.2;
    const targetX = -0.05 + mouse.y * -0.1;
    root.current.rotation.y += (targetY - root.current.rotation.y) * 0.045;
    root.current.rotation.x += (targetX - root.current.rotation.x) * 0.045;
    root.current.position.y = Math.sin(t * 0.65) * 0.045;
  });

  return (
    <group ref={root} position={[0.08, 0.08, 0]}>
      <SoftGlow />

      {/* Depth plate — kitchen */}
      <Float speed={0.65} rotationIntensity={0.1} floatIntensity={0.18}>
        <group position={[-0.62, 0.18, -0.95]} rotation={[-0.04, -0.38, 0.05]} scale={0.84}>
          <ScreenFace src={secondarySrc} width={1.35} height={2.2} />
        </group>
      </Float>

      {/* Hero plate — till */}
      <Float speed={1.05} rotationIntensity={0.16} floatIntensity={0.26}>
        <group position={[0.38, -0.06, 0.2]} rotation={[-0.1, 0.34, 0.04]}>
          <ScreenFace src={primarySrc} width={1.62} height={2.64} />
        </group>
      </Float>

      <ContactShadows
        position={[0, -1.58, 0]}
        opacity={0.38}
        scale={8.5}
        blur={2.8}
        far={4.2}
        color="#1c1917"
      />
    </group>
  );
}

export function HeroProductScene({
  primarySrc = "/site/admin-pos.png",
  secondarySrc = "/site/admin-kds.png",
}: {
  primarySrc?: string;
  secondarySrc?: string;
}) {
  return (
    <Canvas
      className="h-full w-full"
      dpr={[1, 1.75]}
      camera={{ position: [0.15, 0.12, 4.55], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.72} />
      <spotLight
        position={[4.2, 6.2, 3.2]}
        angle={0.42}
        penumbra={0.75}
        intensity={1.65}
        color="#fff4eb"
      />
      <directionalLight position={[-3.5, 2.5, -1]} intensity={0.42} color="#F2651B" />
      <directionalLight position={[1.2, 3.2, 4.2]} intensity={0.58} color="#ffffff" />
      <Suspense fallback={null}>
        <HeroRig primarySrc={primarySrc} secondarySrc={secondarySrc} />
      </Suspense>
    </Canvas>
  );
}
