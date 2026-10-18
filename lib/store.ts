import { create } from 'zustand';
import { CITIES, type ObserverLocation } from './falak/cities';

export type LayerKey =
  | 'horizon'
  | 'meridian'
  | 'primeVertical'
  | 'equator'
  | 'ecliptic'
  | 'diurnal'
  | 'triangle'
  | 'qibla'
  | 'axis'
  | 'arcs'
  | 'grid'
  | 'labels'
  | 'stars';

export type Layers = Record<LayerKey, boolean>;

export const LAYER_LABELS: Record<LayerKey, string> = {
  horizon: 'Ufuk (Horizon)',
  meridian: 'Meridian',
  primeVertical: 'Vertikal Utama',
  equator: 'Ekuator Langit',
  ecliptic: 'Ekliptika',
  diurnal: 'Lintasan Harian',
  triangle: 'Segitiga Bola',
  qibla: 'Arah Kiblat',
  axis: 'Sumbu Kutub',
  arcs: 'Busur h & Az',
  grid: 'Grid Bola',
  labels: 'Label',
  stars: 'Bintang',
};

export type CameraPreset = 'reset' | 'zenith' | 'klu' | 'sun' | 'qibla' | 'horizon';
export type PanelKey = 'hud' | 'control' | 'prayer';
export type ModalState =
  | { type: 'quiz' }
  | { type: 'learn'; section?: string }
  | { type: 'monthly' }
  | null;

type PageView = 'home' | '3d' | 'waktu' | 'kiblat' | 'kuis' | 'panduan';
export type MobileSheet = 'hud' | 'control' | 'prayer' | null;

/** Pilihan kecepatan simulasi Tata Surya (detik simulasi per detik nyata). */
export const SOLAR_SPEEDS: { value: number; label: string; short: string }[] = [
  { value: 1, label: '1 detik/detik', short: '1d' },
  { value: 60, label: '1 menit/detik', short: '1m' },
  { value: 3600, label: '1 jam/detik', short: '1j' },
  { value: 86400, label: '1 hari/detik', short: '1h' },
  { value: 604800, label: '1 minggu/detik', short: '1mgg' },
  { value: 2592000, label: '1 bulan/detik', short: '1bln' },
];

/**
 * Tiga sistem waktu yang TERPISAH:
 *  1. Waktu nyata (jam perangkat)  → halaman Waktu Salat, Beranda, Kiblat, Kuis.
 *  2. `date` (simulasi Bola Langit) → Bola Langit 3D, HUD, panel kontrol.
 *  3. `solarDate` (simulasi Tata Surya) → hanya Penjelajah Tata Surya.
 */
interface AppState {
  activePage: PageView;
  viewMode: 'celestial' | 'solarsystem';
  focusPlanet: string | null;
  mode: 'live' | 'manual';
  date: Date;
  playing: boolean;
  speed: number;

  solarDate: Date;
  solarPlaying: boolean;
  solarSpeed: number;
  mobileSheet: MobileSheet;
  location: ObserverLocation;
  layers: Layers;
  radius: number;
  panels: Record<PanelKey, boolean>;
  modal: ModalState;
  camera: { preset: CameraPreset; nonce: number };
  prayerMethod: string;

  setActivePage: (p: PageView) => void;
  setPrayerMethod: (m: string) => void;
  setViewMode: (v: 'celestial' | 'solarsystem') => void;
  setFocusPlanet: (p: string | null) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  tick: (d: Date) => void;
  goLive: () => void;
  setSimDate: (d: Date) => void;
  shiftMinutes: (min: number) => void;
  shiftSeconds: (sec: number) => void;
  setLocation: (loc: ObserverLocation) => void;
  toggleLayer: (k: LayerKey) => void;
  setLayers: (p: Partial<Layers>) => void;
  setRadius: (r: number) => void;
  togglePanel: (k: PanelKey) => void;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  moveCamera: (p: CameraPreset) => void;

  setSolarPlaying: (p: boolean) => void;
  setSolarSpeed: (s: number) => void;
  solarTick: (d: Date) => void;
  solarNow: () => void;
  shiftSolarDays: (days: number) => void;
  solarManualShiftAction: { days: number; nonce: number } | null;
  setMobileSheet: (s: MobileSheet) => void;
  solarZoomAction: { type: 'in' | 'out' | 'reset'; nonce: number } | null;
  triggerSolarZoom: (type: 'in' | 'out' | 'reset') => void;
}

const STORAGE_KEY = 'astrofalak_location';
const PRAYER_METHOD_KEY = 'astrofalak_prayer_method';

function getInitialPrayerMethod(): string {
  if (typeof window === 'undefined') return 'lfnu';
  try {
    const raw = localStorage.getItem(PRAYER_METHOD_KEY);
    if (raw && typeof raw === 'string') return raw;
  } catch {
    // ignore
  }
  return 'lfnu';
}

function getInitialLocation(): ObserverLocation {
  const defaultLoc = CITIES.find((c) => c.name.includes('Yogyakarta')) || CITIES[0];
  if (typeof window === 'undefined') return defaultLoc;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number' && parsed.name) {
        // Migrasikan cache lama jika sebelumnya sempat tersimpan Jakarta dari default awal
        if (parsed.name === 'Jakarta (Monas)' || parsed.name.includes('Jakarta (Jaringan PC)') || parsed.name.includes('Jakarta (PC)')) {
          return defaultLoc;
        }
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return defaultLoc;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'home',
  viewMode: 'celestial',
  focusPlanet: null,
  mode: 'live',
  date: new Date(),
  playing: false,
  speed: 600,
  location: getInitialLocation(),
  prayerMethod: getInitialPrayerMethod(),
  layers: {
    horizon: true,
    meridian: true,
    primeVertical: false,
    equator: true,
    ecliptic: true,
    diurnal: true,
    triangle: true,
    qibla: true,
    axis: true,
    arcs: true,
    grid: true,
    labels: true,
    stars: true,
  },
  radius: 10,
  panels: { hud: true, control: true, prayer: true },
  modal: null,
  camera: { preset: 'reset', nonce: 0 },

  solarDate: new Date(),
  solarPlaying: true,
  solarSpeed: 3600,
  mobileSheet: null,

  setActivePage: (p) => set({ activePage: p }),
  setPrayerMethod: (prayerMethod) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PRAYER_METHOD_KEY, prayerMethod);
      } catch {
        // ignore
      }
    }
    set({ prayerMethod });
  },
  setViewMode: (v) => set({ viewMode: v }),
  setFocusPlanet: (p) => set({ focusPlanet: p }),
  setPlaying: (p) => set((s) => ({ playing: p, mode: p ? 'manual' : s.mode })),
  setSpeed: (speed) => set({ speed }),
  tick: (d) => set({ date: d }),
  goLive: () => set({ mode: 'live', playing: false, date: new Date() }),
  setSimDate: (d) => set({ mode: 'manual', date: d }),
  shiftMinutes: (min) => set((s) => ({ mode: 'manual', date: new Date(s.date.getTime() + min * 60000) })),
  shiftSeconds: (sec) => set((s) => ({ mode: 'manual', date: new Date(s.date.getTime() + sec * 1000) })),
  setLocation: (location) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
      } catch {
        // ignore
      }
    }
    set({ location });
  },
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setLayers: (p) => set((s) => ({ layers: { ...s.layers, ...p } })),
  setRadius: (radius) => set({ radius }),
  togglePanel: (k) => set((s) => ({ panels: { ...s.panels, [k]: !s.panels[k] } })),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  moveCamera: (preset) => set((s) => ({ camera: { preset, nonce: s.camera.nonce + 1 } })),

  setSolarPlaying: (solarPlaying) => set({ solarPlaying }),
  setSolarSpeed: (solarSpeed) => set({ solarSpeed }),
  solarTick: (solarDate) => set({ solarDate }),
  solarManualShiftAction: null,
  shiftSolarDays: (days) =>
    set((s) => ({
      solarDate: new Date(s.solarDate.getTime() + days * 86400000),
      solarManualShiftAction: { days, nonce: (s.solarManualShiftAction?.nonce || 0) + 1 },
    })),
  solarNow: () =>
    set((s) => {
      const now = new Date();
      const diffDays = (now.getTime() - s.solarDate.getTime()) / 86400000;
      return {
        solarDate: now,
        solarManualShiftAction: { days: diffDays, nonce: (s.solarManualShiftAction?.nonce || 0) + 1 },
      };
    }),
  setMobileSheet: (mobileSheet) => set({ mobileSheet }),
  solarZoomAction: null,
  triggerSolarZoom: (type) => set((s) => ({ solarZoomAction: { type, nonce: (s.solarZoomAction?.nonce || 0) + 1 } })),
}));
