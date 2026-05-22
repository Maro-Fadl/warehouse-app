'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

function FloatingWarehouse({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 0.6, 1.5]} />
        <MeshDistortMaterial
          color="#3b82f6"
          speed={2}
          distort={0.2}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const count = 200;
  const particles = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particles.current) {
      particles.current.rotation.y = state.clock.elapsedTime * 0.02;
      particles.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#60a5fa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function GlowingSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1.5, 64, 64]} position={[3, 0, -2]}>
        <MeshDistortMaterial
          color="#8b5cf6"
          speed={1.5}
          distort={0.4}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.3}
        />
      </Sphere>
    </Float>
  );
}

function TorusKnot() {
  const torusRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torusRef.current) {
      torusRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      torusRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={torusRef} position={[-3, 1, -1]}>
        <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
        <MeshDistortMaterial
          color="#06b6d4"
          speed={2}
          distort={0.15}
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>
    </Float>
  );
}

function MouseFollow() {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const x = (state.pointer.x * viewport.width) / 2;
      const y = (state.pointer.y * viewport.height) / 2;
      meshRef.current.position.x += (x * 0.5 - meshRef.current.position.x) * 0.05;
      meshRef.current.position.y += (y * 0.5 - meshRef.current.position.y) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[0.3, 1]} />
      <MeshDistortMaterial
        color="#f59e0b"
        speed={3}
        distort={0.3}
        roughness={0.4}
        metalness={0.7}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#8b5cf6"
      />

      <FloatingWarehouse position={[-2, -0.5, 0]} />
      <FloatingWarehouse position={[2, 0.5, -1]} />
      <GlowingSphere />
      <TorusKnot />
      <MouseFollow />
      <ParticleField />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export function Hero3D() {
  const { resolvedTheme } = useTheme();

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff']} />
      <fog attach="fog" args={[resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff', 5, 15]} />
      <Scene />
    </Canvas>
  );
}
