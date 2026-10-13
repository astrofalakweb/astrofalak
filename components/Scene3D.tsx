'use client';

import React, { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { D2R, eclipticToEquatorial, equatorialToHorizontal } from '../lib/falak/math';
import { SolarSystem } from './SolarSystem';

const C = {
  horizon: '#14b8a6',
  meridian: '#60a5fa',
  prime: '#94a3b8',
  equator: '#fbbf24',
  ecliptic: '#818cf8',
  diurnal: '#fde68a',
  triangle: '#e879f9',
  qibla: '#f97316',
  axis: '#94a3b8',
  alt: '#fb923c',
  az: '#2dd4bf',
  sunDay: '#fcd34d',
  sunNight: '#f97316',
};

type V3 = THREE.Vector3;

/** (tinggi, azimuth) → vektor dunia. Y = Zenith, +X = Timur, −Z = Utara. */
function horizToVec(alt: number, az: number, r: number): V3 {
  const a = alt * D2R;
  const z = az * D2R;
  return new THREE.Vector3(r * Math.cos(a) * Math.sin(z), r * Math.sin(a), -r * Math.cos(a) * Math.cos(z));
}

function eqToVec(H: number, dec: number, lat: number, r: number): V3 {
  const { altitude, azimuth } = equatorialToHorizontal(H, dec, lat);
  return horizToVec(altitude, azimuth, r);
}

/** Busur lingkaran besar (slerp) antara dua titik pada bola berjari-jari r. */
function greatArc(a: V3, b: V3, r: number, seg = 48): V3[] {
  const ua = a.clone().normalize();
  const ub = b.clone().normalize();
  const ang = ua.angleTo(ub);
  const pts: V3[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    if (ang < 1e-6) {
      pts.push(ua.clone().multiplyScalar(r));
      continue;
    }
    const s = Math.sin(ang);
    const p = ua
      .clone()
      .multiplyScalar(Math.sin((1 - t) * ang) / s)
      .add(ub.clone().multiplyScalar(Math.sin(t * ang) / s));
    pts.push(p.multiplyScalar(r));
  }
  return pts;
}

const mid = (pts: V3[]) => pts[Math.floor(pts.length / 2)];

function Label({ position, color, children, sub }: { position: V3; color: string; children: ReactNode; sub?: string }) {
  return (
    <Html position={position} center distanceFactor={35} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className="whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-tight shadow backdrop-blur-sm"
        style={{ borderColor: color, color, background: 'rgba(2,6,23,0.85)' }}
      >
        {children}
        {sub && <div className="font-mono text-[9px] font-normal opacity-80">{sub}</div>}
      </div>
    </Html>
  );
}

function CameraRig({ sun, klu, qibla }: { sun: V3; klu: V3; qibla: V3 }) {
  const { camera, controls } = useThree();
  const cmd = useAppStore((s) => s.camera);
  const R = useAppStore((s) => s.radius);
  const target = useRef<V3 | null>(null);

  useEffect(() => {
    if (cmd.nonce === 0) return;
    const d = R * 3.2;
    let p: V3;
    switch (cmd.preset) {
      case 'zenith':
        p = new THREE.Vector3(0, d, 0.01);
        break;
      case 'klu':
        p = klu.clone().normalize().multiplyScalar(d).add(new THREE.Vector3(0, 0.01, 0));
        break;
      case 'sun':
        p = sun.clone().normalize().multiplyScalar(-d).add(new THREE.Vector3(0, R * 0.8, 0));
        break;
      case 'qibla':
        p = qibla.clone().normalize().multiplyScalar(-d).add(new THREE.Vector3(0, R * 1.0, 0));
        break;
      case 'horizon':
        p = new THREE.Vector3(0, R * 0.12, R * 3);
        break;
      default:
        p = new THREE.Vector3(R * 1.8, R * 1.2, R * 2.6);
    }
    target.current = p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmd.nonce]);

  useFrame((_, dt) => {
    if (!target.current) return;
    camera.position.lerp(target.current, 1 - Math.pow(0.002, dt));
    camera.lookAt(0, 0, 0);
    (controls as unknown as { update?: () => void } | null)?.update?.();
    if (camera.position.distanceTo(target.current) < 0.05) target.current = null;
  });

  return null;
}

function CelestialSphere() {
  const { sun, loc, qibla } = useAstro();
  const layers = useAppStore((s) => s.layers);
  const R = useAppStore((s) => s.radius);
  const lat = loc.lat;
  const earthRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    if (earthRef.current) earthRef.current.rotation.y += dt * 0.2;
  });

  const zenith = useMemo(() => new THREE.Vector3(0, R, 0), [R]);
  const nadir = useMemo(() => new THREE.Vector3(0, -R, 0), [R]);
  const klu = useMemo(() => horizToVec(lat, 0, R), [lat, R]);
  const kls = useMemo(() => horizToVec(-lat, 180, R), [lat, R]);
  const sunVec = useMemo(() => horizToVec(sun.altitude, sun.azimuth, R), [sun.altitude, sun.azimuth, R]);
  const qiblaVec = useMemo(() => horizToVec(0, qibla.az, R), [qibla.az, R]);

  const circles = useMemo(() => {
    const seg = 128;
    const horizon: V3[] = [];
    const meridian: V3[] = [];
    const prime: V3[] = [];
    const equator: V3[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * 360;
      const tr = t * D2R;
      horizon.push(horizToVec(0, t, R));
      meridian.push(new THREE.Vector3(0, R * Math.sin(tr), -R * Math.cos(tr)));
      prime.push(new THREE.Vector3(R * Math.cos(tr), R * Math.sin(tr), 0));
      equator.push(eqToVec(t, 0, lat, R));
    }
    return { horizon, meridian, prime, equator };
  }, [R, lat]);

  const diurnal = useMemo(() => {
    const pts: V3[] = [];
    for (let t = 0; t <= 360; t += 4) pts.push(eqToVec(t, sun.dec, lat, R));
    return pts;
  }, [sun.dec, lat, R]);

  const ecliptic = useMemo(() => {
    const pts: V3[] = [];
    for (let l = 0; l <= 360; l += 3) {
      const { ra, dec } = eclipticToEquatorial(l, sun.obliquity);
      pts.push(eqToVec(sun.lst - ra, dec, lat, R));
    }
    return pts;
  }, [sun.lst, sun.obliquity, lat, R]);

  const tri = useMemo(
    () => ({ zp: greatArc(zenith, klu, R), ps: greatArc(klu, sunVec, R), zs: greatArc(zenith, sunVec, R) }),
    [zenith, klu, sunVec, R],
  );

  const arcs = useMemo(() => {
    const altArc: V3[] = [];
    const n = 32;
    for (let i = 0; i <= n; i++) altArc.push(horizToVec((sun.altitude * i) / n, sun.azimuth, R));
    const r = R * 0.28;
    const azArc: V3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = ((sun.azimuth * i) / 64) * D2R;
      azArc.push(new THREE.Vector3(r * Math.sin(a), 0.02, -r * Math.cos(a)));
    }
    return { altArc, azArc, foot: horizToVec(0, sun.azimuth, R) };
  }, [sun.altitude, sun.azimuth, R]);

  const qiblaArrow = useMemo(() => {
    const dir = qiblaVec.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { pos: dir.clone().multiplyScalar(R * 0.96), q };
  }, [qiblaVec, R]);

  const sunUp = sun.altitude > 0;
  const sunColor = sunUp ? C.sunDay : C.sunNight;
  const L = layers.labels;

  return (
    <group>
      {/* Bumi / pengamat di pusat */}
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[R * 0.045, 32, 32]} />
          <meshBasicMaterial color="#1d4ed8" />
        </mesh>
        <mesh>
          <sphereGeometry args={[R * 0.047, 12, 8]} />
          <meshBasicMaterial color="#93c5fd" wireframe transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Grid bola langit */}
      {layers.grid && (
        <mesh>
          <sphereGeometry args={[R, 24, 12]} />
          <meshBasicMaterial color="#334155" wireframe transparent opacity={0.12} />
        </mesh>
      )}

      {/* Ufuk */}
      {layers.horizon && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[R, 96]} />
            <meshBasicMaterial color={C.horizon} transparent opacity={0.06} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <Line points={circles.horizon} color={C.horizon} lineWidth={2.2} />
          {/* garis U–S & T–B */}
          <Line points={[horizToVec(0, 0, R), horizToVec(0, 180, R)]} color={C.horizon} lineWidth={0.8} transparent opacity={0.35} />
          <Line points={[horizToVec(0, 90, R), horizToVec(0, 270, R)]} color={C.horizon} lineWidth={0.8} transparent opacity={0.35} />
          {L && (
            <>
              <Label position={horizToVec(0, 0, R * 1.08)} color={C.horizon}>U (0°)</Label>
              <Label position={horizToVec(0, 90, R * 1.08)} color={C.horizon}>T (90°)</Label>
              <Label position={horizToVec(0, 180, R * 1.08)} color={C.horizon}>S (180°)</Label>
              <Label position={horizToVec(0, 270, R * 1.08)} color={C.horizon}>B (270°)</Label>
            </>
          )}
        </group>
      )}

      {/* Meridian & Vertikal Utama */}
      {layers.meridian && <Line points={circles.meridian} color={C.meridian} lineWidth={1.4} transparent opacity={0.6} />}
      {layers.primeVertical && (
        <Line points={circles.prime} color={C.prime} lineWidth={1} dashed dashSize={0.4} gapSize={0.25} transparent opacity={0.6} />
      )}
      {(layers.meridian || layers.triangle) && L && (
        <>
          <Label position={zenith.clone().multiplyScalar(1.06)} color="#e2e8f0">Zenith (Z)</Label>
          <Label position={nadir.clone().multiplyScalar(1.06)} color="#64748b">Nadir</Label>
        </>
      )}

      {/* Sumbu kutub langit */}
      {layers.axis && (
        <group>
          <Line points={[kls.clone().multiplyScalar(1.12), klu.clone().multiplyScalar(1.12)]} color={C.axis} lineWidth={1} dashed dashSize={0.3} gapSize={0.2} />
          <mesh position={klu}>
            <sphereGeometry args={[R * 0.015, 16, 16]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={kls}>
            <sphereGeometry args={[R * 0.015, 16, 16]} />
            <meshBasicMaterial color="#64748b" />
          </mesh>
          {L && (
            <>
              <Label position={klu.clone().multiplyScalar(1.15)} color="#e2e8f0" sub={`h = ${lat.toFixed(2)}°`}>KLU</Label>
              <Label position={kls.clone().multiplyScalar(1.15)} color="#94a3b8" sub={`h = ${(-lat).toFixed(2)}°`}>KLS</Label>
            </>
          )}
        </group>
      )}

      {/* Ekuator langit */}
      {layers.equator && (
        <>
          <Line points={circles.equator} color={C.equator} lineWidth={1.8} transparent opacity={0.9} />
          {L && <Label position={eqToVec(-60, 0, lat, R * 1.04)} color={C.equator}>Ekuator Langit</Label>}
        </>
      )}

      {/* Ekliptika */}
      {layers.ecliptic && (
        <>
          <Line points={ecliptic} color={C.ecliptic} lineWidth={1.6} dashed dashSize={0.5} gapSize={0.25} />
          {L && <Label position={ecliptic[0].clone().multiplyScalar(1.05)} color={C.ecliptic}>γ Titik Aries</Label>}
        </>
      )}

      {/* Lintasan harian matahari (lingkaran deklinasi) */}
      {layers.diurnal && (
        <Line points={diurnal} color={C.diurnal} lineWidth={1.2} dashed dashSize={0.25} gapSize={0.2} transparent opacity={0.7} />
      )}

      {/* Busur tinggi & azimuth */}
      {layers.arcs && (
        <group>
          <Line points={arcs.altArc} color={C.alt} lineWidth={2} />
          <Line points={[new THREE.Vector3(0, 0.02, 0), arcs.foot]} color={C.alt} lineWidth={0.8} dashed dashSize={0.2} gapSize={0.15} />
          <Line points={arcs.azArc} color={C.az} lineWidth={2} />
          {L && (
            <>
              <Label position={mid(arcs.altArc).clone().multiplyScalar(1.05)} color={C.alt}>h = {sun.altitude.toFixed(2)}°</Label>
              <Label position={mid(arcs.azArc).clone().multiplyScalar(1.25)} color={C.az}>Az = {sun.azimuth.toFixed(2)}°</Label>
            </>
          )}
        </group>
      )}

      {/* Segitiga bola Z – KLU – Matahari */}
      {layers.triangle && (
        <group>
          <Line points={tri.zp} color={C.triangle} lineWidth={2.4} />
          <Line points={tri.ps} color={C.triangle} lineWidth={2.4} />
          <Line points={tri.zs} color={C.triangle} lineWidth={2.4} />
          {L && (
            <>
              <Label position={mid(tri.zp).clone().multiplyScalar(1.04)} color={C.triangle} sub={`${(90 - lat).toFixed(2)}°`}>90° − φ</Label>
              <Label position={mid(tri.ps).clone().multiplyScalar(1.04)} color={C.triangle} sub={`${(90 - sun.dec).toFixed(2)}°`}>90° − δ</Label>
              <Label position={mid(tri.zs).clone().multiplyScalar(1.04)} color={C.triangle} sub={`${(90 - sun.altitude).toFixed(2)}°`}>z = 90° − h</Label>
            </>
          )}
        </group>
      )}

      {/* Arah kiblat */}
      {layers.qibla && (
        <group>
          <Line points={[new THREE.Vector3(0, 0.03, 0), qiblaVec]} color={C.qibla} lineWidth={3} />
          <mesh position={qiblaArrow.pos} quaternion={qiblaArrow.q}>
            <coneGeometry args={[R * 0.025, R * 0.08, 16]} />
            <meshBasicMaterial color={C.qibla} />
          </mesh>
          {L && (
            <Label position={qiblaVec.clone().multiplyScalar(1.12)} color={C.qibla} sub={`Az ${qibla.az.toFixed(2)}°`}>
              🕋 Kiblat
            </Label>
          )}
        </group>
      )}

      {/* Matahari */}
      <group position={sunVec}>
        <mesh>
          <sphereGeometry args={[R * 0.035, 32, 32]} />
          <meshBasicMaterial color={sunColor} />
        </mesh>
        <mesh>
          <sphereGeometry args={[R * 0.07, 32, 32]} />
          <meshBasicMaterial color={sunColor} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        {L && (
          <Html center distanceFactor={35} position={[0, R * 0.11, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
            <div className="whitespace-nowrap rounded border border-amber-400/70 bg-slate-950/85 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 shadow backdrop-blur-sm">
              ☀ Matahari {sunUp ? '' : '(di bawah ufuk)'}
            </div>
          </Html>
        )}
      </group>
      <Line points={[new THREE.Vector3(0, 0, 0), sunVec]} color={sunColor} lineWidth={1} transparent opacity={0.45} />

      <CameraRig sun={sunVec} klu={klu} qibla={qiblaVec} />
    </group>
  );
}

function skyBackground(alt: number): string {
  if (alt > 0) return 'radial-gradient(ellipse at 50% 35%, #12305a 0%, #071226 55%, #020617 100%)';
  if (alt > -18) return 'radial-gradient(ellipse at 50% 35%, #2a1d4a 0%, #0d0f2a 55%, #020617 100%)';
  return 'radial-gradient(ellipse at 50% 35%, #0b1224 0%, #030712 60%, #000000 100%)';
}

export function Scene3D() {
  const { sun } = useAstro();
  const showStars = useAppStore((s) => s.layers.stars);
  const R = useAppStore((s) => s.radius);
  const viewMode = useAppStore((s) => s.viewMode);

  return (
    <div className="absolute inset-0 z-0 transition-[background] duration-1000" style={{ background: skyBackground(sun.altitude) }}>
      <Canvas camera={{ position: [18, 12, 26], fov: 45, near: 0.1, far: 2000 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={R * 0.3} maxDistance={R * 10} />
        {showStars && <Stars radius={300} depth={80} count={4000} factor={5} saturation={0} fade speed={0.6} />}
        <React.Suspense fallback={<Html center><div className="flex flex-col items-center gap-2"><div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div><span className="text-sm font-bold text-cyan-500">Memuat Model 3D...</span></div></Html>}>
          {viewMode === 'celestial' ? <CelestialSphere /> : <SolarSystem />}
        </React.Suspense>
      </Canvas>
    </div>
  );
}
