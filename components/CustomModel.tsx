'use client';

import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// Untuk menggunakan file ini, Anda harus mengekspor file .blend Anda ke .glb
// dan menyimpannya di folder: public/models/solar_system.glb
export function CustomSolarSystemModel() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { scene } = useGLTF('/models/solar_system.glb', true, true);
  
  const modelRef = useRef<THREE.Group>(null);

  // Jika Anda ingin menganimasikan rotasi dari model secara keseluruhan
  useFrame((_, dt) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += dt * 0.05;
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={0.5} />
      
      {/* Tambahkan pencahayaan agar model terlihat jelas */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      
      <Html position={[0, -2, 0]} center>
        <div className="rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur">
          Model 3D Kustom Dimuat
        </div>
      </Html>
    </group>
  );
}

// Preload model agar tidak ada jeda loading
useGLTF.preload('/models/solar_system.glb');
