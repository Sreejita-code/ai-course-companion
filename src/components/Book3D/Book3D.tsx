import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { BookPage } from './BookPage';
import { BookCover } from './BookCover';

interface PageContent {
  front: React.ReactNode;
  back: React.ReactNode;
}

interface Book3DProps {
  pages: PageContent[];
  currentPage: number;
  coverContent?: React.ReactNode;
  onPageClick?: () => void;
}

function BookScene({ pages, currentPage, coverContent, onPageClick }: Book3DProps) {
  const pageRotations = useMemo(() => {
    return pages.map((_, index) => {
      // Pages before current are flipped (rotated -180 degrees / -PI)
      // Pages at and after current are not flipped (0 degrees)
      return index < currentPage ? -Math.PI : 0;
    });
  }, [pages, currentPage]);

  // Front cover opens when we start viewing pages
  const frontCoverRotation = currentPage > 0 ? -Math.PI : 0;

  return (
    <group onClick={onPageClick}>
      {/* Front Cover */}
      <BookCover position={[-0.05, 0, 0.15]} rotation={frontCoverRotation}>
        {coverContent}
      </BookCover>

      {/* Pages */}
      {pages.map((page, index) => (
        <BookPage
          key={index}
          position={[0, 0, 0]}
          rotation={pageRotations[index]}
          frontContent={page.front}
          backContent={page.back}
          isFlipping={index === currentPage - 1 || index === currentPage}
          pageIndex={index}
          totalPages={pages.length}
        />
      ))}

      {/* Back Cover */}
      <BookCover position={[-0.05, 0, -0.1 - pages.length * 0.003]} rotation={0} isBack />

      {/* Book Spine */}
      <mesh position={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 4.2, 0.3 + pages.length * 0.003]} />
        <meshStandardMaterial color="#2d2518" roughness={0.6} />
      </mesh>

      {/* Gold spine decoration */}
      <mesh position={[-0.02, 0, 0]}>
        <boxGeometry args={[0.02, 4.2, 0.3 + pages.length * 0.003]} />
        <meshStandardMaterial color="#c9a227" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

export function Book3D({ pages, currentPage, coverContent, onPageClick }: Book3DProps) {
  return (
    <div className="w-full h-[500px] md:h-[600px] cursor-pointer">
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-5, 3, 2]} intensity={0.3} color="#f5c542" />

          <group position={[0, -0.5, 0]} rotation={[0.1, 0.3, 0]}>
            <BookScene
              pages={pages}
              currentPage={currentPage}
              coverContent={coverContent}
              onPageClick={onPageClick}
            />
          </group>

          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />

          <Environment preset="apartment" />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
