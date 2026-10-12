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

interface AppState {
  activePage: PageView;
  viewMode: 'celestial' | 'solarsystem';
  focusPlanet: string | null;
  mode: 'live' | 'manual';
  date: Date;
  playing: boolean;
  speed: number;
  location: ObserverLocation;
  layers: Layers;
  radius: number;
  panels: Record<PanelKey, boolean>;
  modal: ModalState;
  camera: { preset: CameraPreset; nonce: number };

  setActivePage: (p: PageView) => void;
  setViewMode: (v: 'celestial' | 'solarsystem') => void;
  setFocusPlanet: (p: string | null) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  tick: (d: Date) => void;
  goLive: () => void;
  setSimDate: (d: Date) => void;
  shiftMinutes: (min: number) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (s: number) => void;
  setLocation: (loc: ObserverLocation) => void;
  toggleLayer: (k: LayerKey) => void;
  setLayers: (p: Partial<Layers>) => void;
  setRadius: (r: number) => void;
  togglePanel: (k: PanelKey) => void;
  openModal: (m: ModalState) => void;
  closeModal: () => void;
  moveCamera: (p: CameraPreset) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'home',
  viewMode: 'celestial',
  focusPlanet: null,
  mode: 'live',
  date: new Date(),
  playing: false,
  speed: 600,
  location: CITIES[0],
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

  setActivePage: (p) => set({ activePage: p }),
  setViewMode: (v) => set({ viewMode: v }),
  setFocusPlanet: (p) => set({ focusPlanet: p }),
  setPlaying: (p) => set({ playing: p, mode: p ? 'manual' : 'live' }),
  setSpeed: (s) => set({ speed: s }),
  tick: (d) => set({ date: d }),
  goLive: () => set({ mode: 'live', playing: false, date: new Date() }),
  setSimDate: (d) => set({ mode: 'manual', date: d }),
  shiftMinutes: (min) => set((s) => ({ mode: 'manual', date: new Date(s.date.getTime() + min * 60000) })),
  setPlaying: (p) => set((s) => ({ playing: p, mode: p ? 'manual' : s.mode })),
  setSpeed: (speed) => set({ speed }),
  setLocation: (location) => set({ location }),
  toggleLayer: (k) => set((s) => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),
  setLayers: (p) => set((s) => ({ layers: { ...s.layers, ...p } })),
  setRadius: (radius) => set({ radius }),
  togglePanel: (k) => set((s) => ({ panels: { ...s.panels, [k]: !s.panels[k] } })),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  moveCamera: (preset) => set((s) => ({ camera: { preset, nonce: s.camera.nonce + 1 } })),
}));
