"use client";

import React, { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Float } from "@react-three/drei";
import * as THREE from "three";

interface RobotModelProps {
  isFast?: boolean;
}

function RobotModel({ isFast = false }: RobotModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF("/robot.glb");
  const { actions, names } = useAnimations(animations, group);

  const rotationYRef = useRef(0);
  const targetRotationYRef = useRef(0);

  // Disable frustum culling on all SkinnedMeshes so Three.js doesn't cull bones
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.frustumCulled = false;
          (child as THREE.Mesh).castShadow = true;
          (child as THREE.Mesh).receiveShadow = true;
          if ((child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            mat.side = THREE.DoubleSide;
            mat.needsUpdate = true;
          }
        }
      });
    }
  }, [scene]);

  // Play the idle character animation from robot.glb
  useEffect(() => {
    if (names.length > 0 && actions) {
      const animName =
        names.find(
          (n) =>
            n.toLowerCase().includes("idle") ||
            n.toLowerCase().includes("layer") ||
            n.toLowerCase().includes("mixamo")
        ) || names[0];

      const action = actions[animName];
      if (action) {
        action.reset().fadeIn(0.3).play();
      }

      return () => {
        if (action) {
          action.fadeOut(0.3);
        }
      };
    }
  }, [actions, names]);

  // Adjust animation speed when hovered / dragging
  useEffect(() => {
    if (names.length > 0 && actions) {
      const animName =
        names.find(
          (n) =>
            n.toLowerCase().includes("idle") ||
            n.toLowerCase().includes("layer") ||
            n.toLowerCase().includes("mixamo")
        ) || names[0];

      const action = actions[animName];
      if (action) {
        action.timeScale = isFast ? 1.5 : 1.0;
      }
    }
  }, [isFast, actions, names]);

  // Gentle idle rotation & sway
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (group.current) {
      // Natural breathing hover
      group.current.position.y = Math.sin(time * 1.5) * 0.05 - 0.75;

      // Responsive subtle rotation
      targetRotationYRef.current = Math.sin(time * 0.6) * 0.25;
      if (isFast) {
        targetRotationYRef.current += Math.sin(time * 2.5) * 0.15;
      }

      rotationYRef.current = THREE.MathUtils.lerp(
        rotationYRef.current,
        targetRotationYRef.current,
        delta * 3
      );
      group.current.rotation.y = rotationYRef.current;
    }
  });

  return (
    <group ref={group} position={[0, -0.75, 0]}>
      {/* Direct calibrated scale for robot.glb */}
      <primitive object={scene} scale={290} />

      {/* Electric Blue Core Spotlight from underneath */}
      <pointLight
        position={[0, 0.6, 0.8]}
        color="#3b82f6"
        intensity={isFast ? 5.0 : 3.0}
        distance={4.5}
      />
    </group>
  );
}

export interface RobotCompanionProps {
  isFast?: boolean;
  className?: string;
}

export default function RobotCompanionCanvas({
  isFast = false,
  className,
}: RobotCompanionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={className || "w-full h-full min-h-[300px]"}
        style={{ width: "100%", height: "100%", minHeight: "300px" }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border border-blue-500/20 bg-blue-500/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={className || "w-full h-full min-h-[300px]"}
      style={{ width: "100%", height: "100%", minHeight: "300px" }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 3.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{
          pointerEvents: "none",
          width: "100%",
          height: "100%",
          minHeight: "300px",
        }}
      >
        {/* Crisp Studio Lighting */}
        <ambientLight intensity={1.6} />
        <directionalLight position={[5, 7, 5]} intensity={3.2} color="#ffffff" />
        <directionalLight position={[-5, 4, 3]} intensity={2.2} color="#e0e7ff" />
        <directionalLight position={[0, 4, -4]} intensity={3.5} color="#3b82f6" />
        <pointLight position={[0, -2, 2]} intensity={2.0} color="#60a5fa" />

        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.08} floatIntensity={0.15}>
            <RobotModel isFast={isFast} />
          </Float>
        </Suspense>
      </Canvas>
    </div>
  );
}
