'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
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
  { name: 'Pluto', key: 'pluto', color: '#93c5fd' },
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
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta <= 4) {
          // Deteksi nama planet dari mesh/objek atau garis orbit yang diklik
          let current: THREE.Object3D | null = e.object;
          let planetName: string | null = null;
          const map: Record<string, string> = {
            moon: 'Bulan',
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
            pluto: 'Pluto',
          };

          while (current) {
            const lower = current.name.toLowerCase();
            for (const [key, id] of Object.entries(map)) {
              if (lower.includes(key)) {
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
      onPointerOver={(e) => {
        e.stopPropagation();
        if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
      }}
    >
      {children}
    </group>
  );
}

const PLANET_APPROACH_DIST: Record<string, number> = {
  sun: 16.0,
  mercury: 1.4,
  venus: 1.8,
  erath: 2.4,
  earth: 2.4,
  moon: 0.5,
  mars: 1.6,
  jupiter: 6.8,
  saturn: 7.8,
  uranus: 3.5,
  neptune: 3.5,
  pluto: 1.0,
};

const PLANET_LABEL_OFFSET: Record<string, number> = {
  sun: 9.2,
  mercury: 0.8,
  venus: 1.1,
  erath: 1.4,
  earth: 1.4,
  moon: 0.35,
  mars: 1.0,
  jupiter: 3.8,
  saturn: 3.8,
  uranus: 2.0,
  neptune: 2.0,
  pluto: 0.5,
};

/**
 * Menghitung vektor posisi kamera ideal ("Hero View") yang konsisten:
 * Kamera selalu menghadap ke belahan planet yang disinari matahari (sisi siang),
 * dengan elevasi 20 derajat dari bidang orbit dan sudut miring 45 derajat.
 * Menjamin planet selalu tampak terang, indah, stabil, dan tidak pernah 'gonta-ganti' sudut aneh.
 */
function getHeroOffset(planetPos: THREE.Vector3, searchKey: string): THREE.Vector3 {
  const dist = PLANET_APPROACH_DIST[searchKey] || 2.5;

  if (searchKey === 'sun') {
    return new THREE.Vector3(0.5, 0.45, 0.75).normalize().multiplyScalar(dist);
  }

  // Vektor proyeksi horizontal dari Matahari (0,0,0) ke Planet
  const rSun = new THREE.Vector3(planetPos.x, 0, planetPos.z);
  const len = rSun.length();

  if (len < 0.001) {
    return new THREE.Vector3(0, 0.4, 0.9).normalize().multiplyScalar(dist);
  }

  rSun.normalize();
  // Vektor tangensial searah putaran orbit
  const tangent = new THREE.Vector3(-rSun.z, 0, rSun.x);
  const up = new THREE.Vector3(0, 1, 0);

  // Kombinasi vektor hero:
  // - Menghadap sisi siang (-rSun * 0.65)
  // - Sedikit menyamping dari lintasan orbit (tangent * 0.55) -> garis batas bayangan estetik
  // - Terangkat dari bidang orbit (up * 0.35) -> kutub dan cincin terlihat proporsional
  return new THREE.Vector3()
    .addScaledVector(rSun, -0.65)
    .addScaledVector(tangent, 0.55)
    .addScaledVector(up, 0.35)
    .normalize()
    .multiplyScalar(dist);
}

const OVERVIEW_CAM_POS = new THREE.Vector3(0, 42, 62);
const OVERVIEW_TARGET_POS = new THREE.Vector3(0, 0, 0);

interface TransitionData {
  active: boolean;
  startTime: number;
  duration: number;
  startCamPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  isOverview: boolean;
  searchKey: string;
}

function CameraFocuser({ scene }: { scene: THREE.Group }) {
  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const { controls, camera } = useThree();
  const trackedObjRef = useRef<THREE.Object3D | null>(null);
  const lastTargetPos = useRef<THREE.Vector3 | null>(null);

  const transitionRef = useRef<TransitionData>({
    active: false,
    startTime: 0,
    duration: 850,
    startCamPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    isOverview: true,
    searchKey: '',
  });

  // Memicu transisi melayang (glide) yang sinematik dan mulus saat planet disorot atau reset ke Tata Surya
  useEffect(() => {
    const ctrl = controls as any;
    const currentTarget = ctrl && ctrl.target ? ctrl.target.clone() : new THREE.Vector3(0, 0, 0);

    if (!focusPlanet) {
      trackedObjRef.current = null;
      lastTargetPos.current = null;
      transitionRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 850,
        startCamPos: camera.position.clone(),
        startTarget: currentTarget,
        isOverview: true,
        searchKey: '',
      };
      return;
    }

    const def = PLANET_DEFS.find((p) => p.name === focusPlanet);
    const searchKey = def ? def.key : focusPlanet.toLowerCase();
    const targetObj = findPlanetObject(scene, searchKey);

    if (targetObj) {
      trackedObjRef.current = targetObj;
      lastTargetPos.current = null;
      transitionRef.current = {
        active: true,
        startTime: performance.now(),
        duration: 850,
        startCamPos: camera.position.clone(),
        startTarget: currentTarget,
        isOverview: false,
        searchKey,
      };
    } else {
      trackedObjRef.current = null;
      lastTargetPos.current = null;
    }
  }, [focusPlanet, scene, camera, controls]);

  const solarZoomAction = useAppStore((s) => s.solarZoomAction);

  // Penanganan tombol zoom [+], [-], dan [Reset] di HUD
  useEffect(() => {
    if (!solarZoomAction || !controls) return;
    const ctrl = controls as any;
    if (!ctrl.target) return;

    if (solarZoomAction.type === 'reset') {
      if (trackedObjRef.current && focusPlanet) {
        const def = PLANET_DEFS.find((p) => p.name === focusPlanet);
        const searchKey = def ? def.key : focusPlanet.toLowerCase();
        const pos = new THREE.Vector3();
        trackedObjRef.current.getWorldPosition(pos);
        const heroOffset = getHeroOffset(pos, searchKey);
        ctrl.target.copy(pos);
        camera.position.copy(pos.clone().add(heroOffset));
        ctrl.update();
      } else {
        ctrl.target.copy(OVERVIEW_TARGET_POS);
        camera.position.copy(OVERVIEW_CAM_POS);
        ctrl.update();
      }
      return;
    }

    const offset = camera.position.clone().sub(ctrl.target);
    const factor = solarZoomAction.type === 'in' ? 0.68 : 1.45;
    const newOffset = offset.multiplyScalar(factor);

    const len = newOffset.length();
    if (len < 0.05) newOffset.setLength(0.05);
    if (len > 3000) newOffset.setLength(3000);

    camera.position.copy(ctrl.target.clone().add(newOffset));
    ctrl.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarZoomAction]);

  useFrame(() => {
    const ctrl = controls as any;
    if (!ctrl || !ctrl.target) return;

    // FASE 1: Transisi kamera melayang (cinematic smooth glide)
    if (transitionRef.current.active) {
      const tr = transitionRef.current;
      const elapsed = performance.now() - tr.startTime;
      const tNorm = Math.min(Math.max(elapsed / tr.duration, 0), 1);
      // Kurva cubic ease-out: meluncur cepat lalu mendarat dengan sangat lembut
      const ease = 1 - Math.pow(1 - tNorm, 3);

      if (tr.isOverview) {
        ctrl.target.lerpVectors(tr.startTarget, OVERVIEW_TARGET_POS, ease);
        camera.position.lerpVectors(tr.startCamPos, OVERVIEW_CAM_POS, ease);
      } else if (trackedObjRef.current) {
        const currentPos = new THREE.Vector3();
        trackedObjRef.current.getWorldPosition(currentPos);
        const heroOffset = getHeroOffset(currentPos, tr.searchKey);
        const destCamPos = currentPos.clone().add(heroOffset);

        ctrl.target.lerpVectors(tr.startTarget, currentPos, ease);
        camera.position.lerpVectors(tr.startCamPos, destCamPos, ease);
        lastTargetPos.current = currentPos.clone();
      }

      if (ctrl.target0) ctrl.target0.copy(ctrl.target);
      if (ctrl.position0) ctrl.position0.copy(camera.position);
      ctrl.update();

      if (tNorm >= 1) {
        tr.active = false;
      }
      return;
    }

    // FASE 2: Pelacakan orbit mulus & terkunci stabil (rock-solid lockstep) setelah tiba di planet
    if (trackedObjRef.current && focusPlanet) {
      const currentPos = new THREE.Vector3();
      trackedObjRef.current.getWorldPosition(currentPos);

      if (lastTargetPos.current) {
        // Geser target dan posisi kamera secara serentak persis sebesar delta pergerakan orbit
        const delta = currentPos.clone().sub(lastTargetPos.current);
        ctrl.target.add(delta);
        camera.position.add(delta);
      } else {
        const offset = camera.position.clone().sub(ctrl.target);
        ctrl.target.copy(currentPos);
        camera.position.copy(currentPos.clone().add(offset));
      }
      lastTargetPos.current = currentPos.clone();

      if (ctrl.target0) ctrl.target0.copy(ctrl.target);
      if (ctrl.position0) ctrl.position0.copy(camera.position);
      ctrl.update();
    }
  });

  return null;
}

function PlanetLabel({
  target,
  name,
  color,
  searchKey,
}: {
  target: THREE.Object3D;
  name: string;
  color: string;
  searchKey: string;
}) {
  const ref = useRef<THREE.Group>(null);
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);
  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const { camera } = useThree();

  const isFocused = focusPlanet === name;

  useFrame(() => {
    if (ref.current && target) {
      const pos = new THREE.Vector3();
      target.getWorldPosition(pos);
      const yOffset = PLANET_LABEL_OFFSET[searchKey] || 1.4;
      pos.y += yOffset;
      ref.current.position.copy(pos);

      const approachDist = PLANET_APPROACH_DIST[searchKey] || 2.5;
      const camDist = camera.position.distanceTo(pos);
      const tooClose = camDist < approachDist * 1.8;

      // Update visibilitas langsung pada obyek 3D tanpa memicu React setState di dalam useFrame
      ref.current.visible = !isFocused && !tooClose;
    }
  });

  return (
    <group ref={ref}>
      <Html center zIndexRange={[15, 0]}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFocusPlanet(name);
          }}
          title={`Fokus ke ${name}`}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-slate-200 shadow-xl backdrop-blur-md transition-all whitespace-nowrap hover:scale-105 hover:border-cyan-400 hover:text-white hover:bg-slate-900 active:scale-95 select-none"
        >
          <span className="h-1.5 w-1.5 rounded-full shrink-0 shadow-[0_0_6px_currentColor]" style={{ backgroundColor: color, color }} />
          <span>{name}</span>
        </button>
      </Html>
    </group>
  );
}

function PlanetLabels({ scene }: { scene: THREE.Group }) {
  const showLabels = useAppStore((s) => s.layers.labels);
  const [planetObjects, setPlanetObjects] = useState<{ name: string; color: string; searchKey: string; obj: THREE.Object3D }[]>([]);

  useEffect(() => {
    const list: { name: string; color: string; searchKey: string; obj: THREE.Object3D }[] = [];
    for (const def of PLANET_DEFS) {
      const obj = findPlanetObject(scene, def.key);
      if (obj) {
        list.push({ name: def.name, color: def.color, searchKey: def.key, obj });
      }
    }
    setPlanetObjects(list);
  }, [scene]);

  if (!showLabels) return null;

  return (
    <group>
      {planetObjects.map((p) => (
        <PlanetLabel key={p.name} target={p.obj} name={p.name} color={p.color} searchKey={p.searchKey} />
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
  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const solarManualShiftAction = useAppStore((s) => s.solarManualShiftAction);

  // Toggle & sorot Garis Edar (orbit paths) di model 3D
  useEffect(() => {
    const def = PLANET_DEFS.find((p) => p.name === focusPlanet);
    const activeKey = def ? def.key : focusPlanet?.toLowerCase();

    scene.traverse((child) => {
      const name = child.name.toLowerCase();
      const parentName = child.parent?.name.toLowerCase() || '';
      const isOrbit = name.includes('.001') || parentName.includes('.001');

      if (isOrbit) {
        child.visible = showGrid;
        if ((child as any).material) {
          const isSelected = activeKey && (name.includes(activeKey) || parentName.includes(activeKey));
          (child as any).material.transparent = true;
          (child as any).material.opacity = showGrid ? (isSelected ? 1.0 : focusPlanet ? 0.4 : 0.75) : 0;
          (child as any).material.depthWrite = false;
          if ((child as any).material.color) {
            (child as any).material.color.set(isSelected ? (def?.color || '#38bdf8') : '#38bdf8');
          }
        }
      } else {
        child.visible = true;
      }
    });
  }, [scene, showGrid, focusPlanet]);

  // Sinkronkan HANYA saat ada aksi manual tanggal (+1 Hari / -1 Hari / Sekarang), TIDAK menginterupsi animasi saat berjalan
  useEffect(() => {
    if (!actions || !solarManualShiftAction) return;
    const { days } = solarManualShiftAction;
    Object.values(actions).forEach((action) => {
      if (action) {
        const clip = action.getClip();
        const shiftSeconds = (days * 0.8) % clip.duration;
        let newTime = action.time + shiftSeconds;
        while (newTime < 0) newTime += clip.duration;
        action.time = newTime % clip.duration;
      }
    });
  }, [solarManualShiftAction, actions]);

  // Kontrol putaran animasi model 3D: kecepatan terkalibrasi sangat mulus 60 FPS bebas getar / stuttering
  useEffect(() => {
    if (!actions) return;

    let scale = 0.35;
    if (solarSpeed <= 1) scale = 0.04;
    else if (solarSpeed <= 60) scale = 0.12;
    else if (solarSpeed <= 3600) scale = 0.35;
    else if (solarSpeed <= 86400) scale = 0.85;      // 1 Hari: pergerakan harian yang sangat mulus & stabil
    else if (solarSpeed <= 604800) scale = 1.75;    // 1 Minggu: putaran cepat terinterpolasi mulus 60 FPS
    else scale = 2.8;                               // 1 Bulan: pergerakan cepat, konsisten & mulus bebas patah-patah

    Object.values(actions).forEach((action) => {
      if (action) {
        action.timeScale = scale;
        if (solarPlaying) {
          action.paused = false;
          action.play();
        } else {
          action.paused = true;
        }
      }
    });
  }, [actions, solarPlaying, solarSpeed]);

  return (
    <group>
      {/* Post-processing: luminanceThreshold dioptimasi agar planet tidak silau terbakar dan framerate GPU maksimal */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.88} mipmapBlur intensity={1.0} radius={0.5} />
      </EffectComposer>

      {/* Pencahayaan universal jika model tidak memiliki lighting sendiri */}
      <ambientLight intensity={1.4} color="#ffffff" />
      <directionalLight position={[100, 100, 100]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-100, -100, -100]} intensity={0.5} color="#94a3b8" />

      {/* Controller kamera terpadu tanpa konflik Bounds */}
      <SelectToZoom>
        <CameraFocuser scene={scene} />
        <PlanetLabels scene={scene} />
        <group ref={group} dispose={null}>
          <primitive object={scene} />
        </group>
      </SelectToZoom>
    </group>
  );
}

// Preload agar loading instant ketika switch toggle
useGLTF.preload('/models/solar_system.glb');
