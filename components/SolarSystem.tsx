'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations, Bounds, useBounds, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppStore } from '../lib/store';

function SelectToZoom({ children }: { children: React.ReactNode }) {
  const api = useBounds();
  const setFocusPlanet = useAppStore(s => s.setFocusPlanet);
  
  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 2) {
          api.refresh(e.object).fit();
          
          // Deteksi nama planet dari mesh yang diklik dengan mengecek ke atas hirarki
          let current: THREE.Object3D | null = e.object;
          let planetName: string | null = null;
          const map: Record<string, string> = {
            'sun': 'Matahari', 'mercury': 'Merkurius', 'venus': 'Venus', 
            'erath': 'Bumi', 'earth': 'Bumi', 'mars': 'Mars', 
            'jupiter': 'Jupiter', 'saturn': 'Saturnus', 
            'uranus': 'Uranus', 'neptune': 'Neptunus', 'moon': 'Bulan'
          };
          
          while (current) {
            const lower = current.name.toLowerCase();
            for (const [key, id] of Object.entries(map)) {
              if (lower.includes(key) && !lower.includes('bezier') && !lower.includes('circle')) {
                planetName = id;
                break;
              }
            }
            if (planetName) break;
            current = current.parent;
          }
          
          if (planetName) {
            setFocusPlanet(planetName);
          }
        }
      }}
      onPointerMissed={(e) => {
        if (e.button === 0) {
          api.refresh().fit();
          setFocusPlanet(null);
        }
      }}
    >
      {children}
    </group>
  );
}

function CameraFocuser({ scene }: { scene: THREE.Group }) {
  const focusPlanet = useAppStore(s => s.focusPlanet);
  const api = useBounds();
  const { controls } = useThree();
  const [trackedObj, setTrackedObj] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!focusPlanet) {
      setTrackedObj(null);
      api.refresh().fit();
      return;
    }

    const map: Record<string, string> = {
      'Matahari': 'sun', 'Merkurius': 'mercury', 'Venus': 'venus',
      'Bumi': 'erath', 'Mars': 'mars', 'Jupiter': 'jupiter',
      'Saturnus': 'saturn', 'Uranus': 'uranus', 'Neptunus': 'neptune',
      'Bulan': 'moon'
    };

    const searchKey = map[focusPlanet];
    let targetObj: THREE.Object3D | null = null;
    
    scene.traverse((child) => {
      if (targetObj) return; // Hentikan pencarian jika sudah ketemu
      
      const name = child.name.toLowerCase();
      if (
        name.includes(searchKey) && 
        !name.includes('bezier') && 
        !name.includes('circle')
      ) {
        targetObj = child;
      }
    });

    if (targetObj) {
      setTrackedObj(targetObj);
      api.refresh(targetObj).fit();
    } else {
      setTrackedObj(null);
      api.refresh().fit();
    }
  }, [focusPlanet, scene, api]);

  useFrame(() => {
    if (trackedObj && controls) {
      const pos = new THREE.Vector3();
      trackedObj.getWorldPosition(pos);
      // Terus update target kamera agar mengikuti planet yang sedang mengorbit
      (controls as any).target.lerp(pos, 0.1);
      (controls as any).update();
    }
  });

  return null;
}

export function SolarSystem() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/solar_system.glb');
  const { actions } = useAnimations(animations, group);

  // Mainkan semua animasi yang ada di dalam model
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        if (action) {
          action.play();
        }
      });
    }
  }, [actions]);

  return (
    <group>
      {/* Post-processing agar lebih memukau seperti tata surya */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
      </EffectComposer>

      {/* Pencahayaan universal jika model tidak memiliki lighting sendiri */}
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[100, 100, 100]} intensity={2.5} color="#ffffff" />
      <directionalLight position={[-100, -100, -100]} intensity={0.5} color="#94a3b8" />

      {/* Bounds memastikan kamera & model selalu proporsional dan berada di tengah */}
      <Bounds fit clip observe margin={1.2}>
        <SelectToZoom>
          <CameraFocuser scene={scene} />
          <group ref={group} dispose={null}>
            <primitive object={scene} />
          </group>
        </SelectToZoom>
      </Bounds>
    </group>
  );
}

// Preload agar loading instant ketika switch toggle
useGLTF.preload('/models/solar_system.glb');
