import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface BookPageProps {
  position: [number, number, number];
  rotation: number;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isFlipping: boolean;
  pageIndex: number;
  totalPages: number;
}

export function BookPage({
  position,
  rotation,
  frontContent,
  backContent,
  pageIndex,
  totalPages,
}: BookPageProps) {
  const meshRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(rotation);

  // Update target rotation when prop changes
  targetRotation.current = rotation;

  useFrame(() => {
    if (meshRef.current) {
      // Smooth rotation interpolation
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation.current,
        0.08
      );
    }
  });

  // Page dimensions
  const pageWidth = 3;
  const pageHeight = 4;
  const pageDepth = 0.02;

  // Calculate z-offset based on page index for stacking
  const zOffset = (totalPages - pageIndex) * 0.003;

  const pageMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#faf6f0',
        roughness: 0.8,
        metalness: 0.05,
      }),
    []
  );

  const pageEdgeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e8e0d4',
        roughness: 0.9,
      }),
    []
  );

  return (
    <group ref={meshRef} position={[position[0], position[1], position[2] + zOffset]}>
      {/* Page geometry - pivot point on left edge */}
      <mesh
        position={[pageWidth / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[pageWidth, pageHeight, pageDepth]} />
        <meshStandardMaterial attach="material-0" {...pageEdgeMaterial} />
        <meshStandardMaterial attach="material-1" {...pageEdgeMaterial} />
        <meshStandardMaterial attach="material-2" {...pageEdgeMaterial} />
        <meshStandardMaterial attach="material-3" {...pageEdgeMaterial} />
        <meshStandardMaterial attach="material-4" {...pageMaterial} />
        <meshStandardMaterial attach="material-5" {...pageMaterial} />
      </mesh>

      {/* Front content (visible when page is not flipped) */}
      <Html
        position={[pageWidth / 2, 0, pageDepth / 2 + 0.01]}
        transform
        occlude
        style={{
          width: '280px',
          height: '380px',
          pointerEvents: 'none',
        }}
      >
        <div className="w-full h-full flex items-center justify-center p-4 select-none">
          {frontContent}
        </div>
      </Html>

      {/* Back content (visible when page is flipped) */}
      <Html
        position={[pageWidth / 2, 0, -pageDepth / 2 - 0.01]}
        transform
        occlude
        rotation={[0, Math.PI, 0]}
        style={{
          width: '280px',
          height: '380px',
          pointerEvents: 'none',
        }}
      >
        <div className="w-full h-full flex items-center justify-center p-4 select-none">
          {backContent}
        </div>
      </Html>
    </group>
  );
}
