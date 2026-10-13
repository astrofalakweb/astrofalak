'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations, Bounds, useBounds, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useAppStore } from '../lib/store';

const PLANET_DEFS = [
  { name: 'Matahari', key: 'sun', color: '#f59e0b' },
  { name: 'Merkurius', key: 'mercury', color: '#94a3b8' },
  { name: 'Venus', key: 'venus', color: '#facc15' },
  { name: 'Bumi', key: 'erath', color: '#38bdf8' },
  { name: 'Bulan', key: 'moon', color: '#cbd5e1' },
  { name: 'Mars', key: 'mars', color: '#f87171' },
  { name: 'Jupiter', key: 'jupiter', color: '#fb923c' },
  { name: 'Saturnus', key: 'saturn', color: '#eab308' },
  { name: 'Uranus', key: 'uranus', color: '#2dd4bf' },
  { name: 'Neptunus', key: 'neptune', color: '#60a5fa' },
];

function findPlanetObject(scene: THREE.Group, key: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  scene.traverse((child) => {
    if (found) return;
    const name = child.name.toLowerCase();
    if (name.includes(key) && !name.includes('bezier') && !name.includes('circle')) {
      found = child;
    }
  });
  return found;
}

function SelectToZoom({ children }: { children: React.ReactNode }) {
  const api = useBounds();
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);

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
            sun: 'Matahari',
            mercury: 'Merkurius',
            venus: 'Venus',
            erath: 'Bumi',
            earth: 'Bumi',
            mars: 'Mars',
            jupiter: 'Jupiter',
            saturn: 'Saturnus',
            uranus: 'Uranus',
            neptune: 'Neptunus',
            moon: 'Bulan',
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
  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const api = useBounds();
  const { controls } = useThree();
  const [trackedObj, setTrackedObj] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!focusPlanet) {
      setTrackedObj(null);
      api.refresh().fit();
      return;
    }

    const def = PLANET_DEFS.find((p) => p.name === focusPlanet);
    const searchKey = def ? def.key : focusPlanet.toLowerCase();
    const targetObj = findPlanetObject(scene, searchKey);

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

function PlanetLabel({ target, name, color }: { target: THREE.Object3D; name: string; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);
  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const isFocused = focusPlanet === name;

  useFrame(() => {
    if (ref.current && target) {
      const pos = new THREE.Vector3();
      target.getWorldPosition(pos);
      pos.y += 1.4;
      ref.current.position.copy(pos);
    }
  });

  return (
    <group ref={ref}>
      <Html center distanceFactor={220} zIndexRange={[15, 0]}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFocusPlanet(isFocused ? null : name);
          }}
          className={`pointer-events-auto flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-xl backdrop-blur-md transition-all whitespace-nowrap active:scale-95 ${
            isFocused
              ? 'border-cyan-400 bg-cyan-500/30 text-cyan-200 ring-2 ring-cyan-400/40 shadow-cyan-500/20'
              : 'border-slate-700/80 bg-slate-950/85 text-slate-200 hover:border-cyan-400 hover:text-white'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span>{name}</span>
        </button>
      </Html>
    </group>
  );
}

function PlanetLabels({ scene }: { scene: THREE.Group }) {
  const showLabels = useAppStore((s) => s.layers.labels);
  const [planetObjects, setPlanetObjects] = useState<{ name: string; color: string; obj: THREE.Object3D }[]>([]);

  useEffect(() => {
    const list: { name: string; color: string; obj: THREE.Object3D }[] = [];
    for (const def of PLANET_DEFS) {
      const obj = findPlanetObject(scene, def.key);
      if (obj) {
        list.push({ name: def.name, color: def.color, obj });
      }
    }
    setPlanetObjects(list);
  }, [scene]);

  if (!showLabels) return null;

  return (
    <group>
      {planetObjects.map((p) => (
        <PlanetLabel key={p.name} target={p.obj} name={p.name} color={p.color} />
      ))}
    </group>
  );
}

export function SolarSystem() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/solar_system.glb');
  const { actions } = useAnimations(animations, group);

  const showGrid = useAppStore((s) => s.layers.grid);
  const solarPlaying = useAppStore((s) => s.solarPlaying);
  const solarSpeed = useAppStore((s) => s.solarSpeed);

  // Toggle Garis Edar (orbit paths) di model 3D
  useEffect(() => {
    scene.traverse((child) => {
      const name = child.name.toLowerCase();
      const parentName = child.parent?.name.toLowerCase() || '';
      const isOrbit = name.includes('.001') || parentName.includes('.001');

      if (isOrbit) {
        child.visible = showGrid;
        if ((child as any).material) {
          (child as any).material.transparent = true;
          (child as any).material.opacity = showGrid ? 0.75 : 0;
          (child as any).material.depthWrite = showGrid;
          if ((child as any).material.color) {
            (child as any).material.color.set(showGrid ? '#38bdf8' : '#1e293b');
          }
        }
      } else {
        // Objek planet, matahari, cincin, dan pivot animasinya HARUS selalu terlihat
        child.visible = true;
      }
    });
  }, [scene, showGrid]);

  // Kontrol putaran animasi model 3D berdasarkan solarPlaying dan solarSpeed
  useEffect(() => {
    if (!actions) return;

    let scale = 1;
    if (solarSpeed <= 1) scale = 0.05;
    else if (solarSpeed <= 60) scale = 0.25;
    else if (solarSpeed <= 3600) scale = 0.75;
    else if (solarSpeed <= 86400) scale = 1.8;
    else if (solarSpeed <= 604800) scale = 3.5;
    else scale = 6.0;

    Object.values(actions).forEach((action) => {
      if (action) {
        action.timeScale = scale;
        if (solarPlaying) {
          action.play();
          action.paused = false;
        } else {
          action.paused = true;
        }
      }
    });
  }, [actions, solarPlaying, solarSpeed]);

  return (
    <group>
      {/* Post-processing agar lebih memukau seperti tata surya */}
      <EffectComposer>
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
          <PlanetLabels scene={scene} />
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
