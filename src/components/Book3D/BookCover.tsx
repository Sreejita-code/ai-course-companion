import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface BookCoverProps {
  position: [number, number, number];
  rotation: number;
  isBack?: boolean;
  children?: React.ReactNode;
}

export function BookCover({ position, rotation, isBack = false, children }: BookCoverProps) {
  const meshRef = useRef<THREE.Group>(null);
  const targetRotation = useRef(rotation);

  targetRotation.current = rotation;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation.current,
        0.08
      );
    }
  });

  const coverWidth = 3.1;
  const coverHeight = 4.2;
  const coverDepth = 0.08;

  const coverMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: isBack ? '#2d2518' : '#3d3020',
        roughness: 0.6,
        metalness: 0.1,
      }),
    [isBack]
  );

  const spineMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c9a227',
        roughness: 0.4,
        metalness: 0.3,
      }),
    []
  );

  return (
    <group ref={meshRef} position={position}>
      {/* Cover */}
      <mesh position={[coverWidth / 2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[coverWidth, coverHeight, coverDepth]} />
        <meshStandardMaterial {...coverMaterial} />
      </mesh>

      {/* Gold trim on edges */}
      {!isBack && (
        <>
          <mesh position={[coverWidth, 0, 0]}>
            <boxGeometry args={[0.02, coverHeight, coverDepth + 0.01]} />
            <meshStandardMaterial {...spineMaterial} />
          </mesh>
          <mesh position={[coverWidth / 2, coverHeight / 2, 0]}>
            <boxGeometry args={[coverWidth + 0.02, 0.02, coverDepth + 0.01]} />
            <meshStandardMaterial {...spineMaterial} />
          </mesh>
          <mesh position={[coverWidth / 2, -coverHeight / 2, 0]}>
            <boxGeometry args={[coverWidth + 0.02, 0.02, coverDepth + 0.01]} />
            <meshStandardMaterial {...spineMaterial} />
          </mesh>
        </>
      )}

      {/* Content on cover */}
      {children && !isBack && (
        <Html
          position={[coverWidth / 2, 0, coverDepth / 2 + 0.01]}
          transform
          occlude
          style={{
            width: '280px',
            height: '380px',
            pointerEvents: 'none',
          }}
        >
          <div className="w-full h-full flex items-center justify-center p-4 select-none">
            {children}
          </div>
        </Html>
      )}
    </group>
  );
}
