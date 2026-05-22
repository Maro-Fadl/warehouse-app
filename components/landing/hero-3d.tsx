'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, OrbitControls, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

function FloatingWarehouse({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.scale.lerp(
        new THREE.Vector3(hovered ? 1.2 * scale : scale, hovered ? 1.2 * scale : scale, hovered ? 1.2 * scale : scale),
        0.1
      );
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.2, 0.7, 1.6]} />
        <MeshDistortMaterial
          color={hovered ? '#60a5fa' : '#3b82f6'}
          speed={2}
          distort={hovered ? 0.3 : 0.2}
          roughness={0.3}
          metalness={0.8}
        />
        {/* Door */}
        <mesh position={[0, -0.1, 0.81]}>
          <boxGeometry args={[0.4, 0.5, 0.01]} />
          <meshStandardMaterial color="#1e40af" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Windows */}
        {[-0.3, 0.3].map((x, i) => (
          <mesh key={i} position={[x, 0.15, 0.81]}>
            <boxGeometry args={[0.15, 0.15, 0.01]} />
            <meshStandardMaterial color="#93c5fd" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const count = 300;
  const particles = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    const palette = [
      [0.37, 0.51, 0.96], // blue
      [0.55, 0.36, 0.96], // purple
      [0.02, 0.71, 0.83], // cyan
    ];
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      cols[i * 3] = color[0];
      cols[i * 3 + 1] = color[1];
      cols[i * 3 + 2] = color[2];
    }
    return cols;
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
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function GlowingSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={1}>
      <Sphere
        ref={sphereRef}
        args={[1.5, 64, 64]}
        position={[3.5, 0, -2]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <MeshDistortMaterial
          color={hovered ? '#a78bfa' : '#8b5cf6'}
          speed={1.5}
          distort={hovered ? 0.5 : 0.4}
          roughness={0.2}
          metalness={0.9}
          transparent
          opacity={0.4}
        />
      </Sphere>
    </Float>
  );
}

function TorusKnot() {
  const torusRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (torusRef.current) {
      torusRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      torusRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh
        ref={torusRef}
        position={[-3.5, 1, -1]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <torusKnotGeometry args={[0.8, 0.25, 128, 32]} />
        <MeshDistortMaterial
          color={hovered ? '#22d3ee' : '#06b6d4'}
          speed={2}
          distort={hovered ? 0.25 : 0.15}
          roughness={0.3}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

function MouseFollow() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, pointer } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      const targetX = (pointer.x * viewport.width) / 2;
      const targetY = (pointer.y * viewport.height) / 2;
      meshRef.current.position.x += (targetX * 0.4 - meshRef.current.position.x) * 0.08;
      meshRef.current.position.y += (targetY * 0.4 - meshRef.current.position.y) * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <icosahedronGeometry args={[0.35, 1]} />
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

function ScrollReactiveCamera() {
  const { camera } = useThree();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame(() => {
    const targetY = -scrollY * 0.002;
    camera.position.y += (targetY - camera.position.y) * 0.05;
  });

  return null;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.6} color="#3b82f6" />
      <spotLight
        position={[0, 15, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.8}
        color="#8b5cf6"
        castShadow
      />

      <FloatingWarehouse position={[-2.5, -0.5, 0]} scale={0.9} />
      <FloatingWarehouse position={[2.5, 0.5, -1]} scale={1.1} />
      <GlowingSphere />
      <TorusKnot />
      <MouseFollow />
      <ParticleField />
      <ScrollReactiveCamera />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.3}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 2.5}
        rotateSpeed={0.5}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: undefined as any,
        }}
      />
    </>
  );
}

export function Hero3D() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-background via-background to-primary/5" />
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ background: 'transparent', touchAction: 'pan-y' }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      performance={{ min: 0.5 }}
    >
      <color attach="background" args={[resolvedTheme === 'dark' ? '#0a0a0a' : '#f8fafc']} />
      <fog attach="fog" args={[resolvedTheme === 'dark' ? '#0a0a0a' : '#f8fafc', 8, 20]} />
      <Scene />
    </Canvas>
  );
}
