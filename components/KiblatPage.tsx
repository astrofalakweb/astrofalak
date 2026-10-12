import { useState, useEffect } from 'react';
import { useAstro } from '../lib/useAstro';
import { useAppStore } from '../lib/store';
import { Compass, MapPin, Crosshair } from 'lucide-react';

export function KiblatPage() {
  const { qibla, loc } = useAstro();
  const setLocation = useAppStore(s => s.setLocation);
  
  const [heading, setHeading] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  
  // Deteksi rotasi HP (Kompas)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let h = 0;
      // Untuk iOS
      if ('webkitCompassHeading' in e) {
        h = (e as any).webkitCompassHeading;
      } 
      // Untuk Android (absolute)
      else if (e.absolute && e.alpha !== null) {
        h = 360 - e.alpha;
      }
      setHeading(h);
    };

    // Minta izin untuk iOS 13+
    const requestAccess = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const p = await (DeviceOrientationEvent as any).requestPermission();
          if (p === 'granted') {
            window.addEventListener('deviceorientationabsolute', handleOrientation);
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    requestAccess();
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Ambil lokasi GPS
  const getLocation = () => {
    setIsLocating(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('GPS tidak didukung di perangkat ini.');
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          name: 'Lokasi Anda (GPS)',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          tz: Math.round(new Date().getTimezoneOffset() / -60),
          elevation: pos.coords.altitude || 0
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setGeoError('Gagal mendapatkan lokasi. Pastikan izin GPS aktif.');
      },
      { enableHighAccuracy: true }
    );
  };

  // Rotasi kompas
  const compassRotation = -heading;
  const qiblaPointerRotation = qibla.az - heading;
  // Toleransi 3 derajat dianggap menghadap Ka'bah
  const diff = Math.abs(qiblaPointerRotation % 360);
  const isFacingQibla = diff < 3 || diff > 357;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070e14] text-slate-200">
      <div className="mx-auto max-w-lg px-4 py-8 pb-24">
        
        {/* Header & GPS Button */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#111923] p-4 shadow-lg">
            <div>
              <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1 mb-1"><MapPin className="h-3 w-3"/> Lokasi Anda</div>
              <div className="text-sm font-bold text-teal-400">{loc.name}</div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">{loc.lat.toFixed(4)}°, {loc.lon.toFixed(4)}°</div>
            </div>
            <button 
              onClick={getLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 rounded-lg bg-teal-500/10 px-4 py-2.5 text-xs font-bold text-teal-400 border border-teal-500/20 transition-colors hover:bg-teal-500/20 disabled:opacity-50 active:scale-95"
            >
              <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'Mencari...' : 'Gunakan GPS'}
            </button>
          </div>
          {geoError && <div className="text-xs text-rose-400 font-semibold px-2">{geoError}</div>}
        </div>

        {/* Dynamic Compass Ala Qibla Finder */}
        <div className="relative mb-12 flex flex-col items-center justify-center py-6 overflow-hidden">
          
          {/* Status menghadap Kiblat */}
          <div className={`absolute top-0 z-10 transition-all duration-300 ${isFacingQibla ? 'scale-110 text-emerald-400' : 'scale-100 text-slate-400'}`}>
            <div className="text-xs font-bold uppercase tracking-widest text-center">
              {isFacingQibla ? 'Anda Menghadap Kiblat' : 'Arahkan HP Anda'}
            </div>
          </div>

          <div className="relative mt-12 flex h-[300px] w-[300px] items-center justify-center rounded-full border-[8px] border-[#0c141d] bg-[#0f1721] shadow-2xl">
            {/* Piringan Kompas (Berputar) */}
            <div 
              className="absolute h-full w-full rounded-full transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${compassRotation}deg)` }}
            >
              {/* Garis-garis derajat */}
              {Array.from({ length: 72 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`absolute left-1/2 top-0 -translate-x-1/2 origin-[50%_150px] ${i % 18 === 0 ? 'h-3 w-[2px] bg-slate-400' : 'h-1.5 w-[1px] bg-slate-700'}`}
                  style={{ transform: `rotate(${i * 5}deg)` }}
                />
              ))}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-rose-500">U</div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm font-bold text-slate-500">S</div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">T</div>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">B</div>
            </div>
            
            {/* Panah Kiblat (Berputar menyesuaikan target) */}
            <div 
              className="absolute h-full w-full transition-transform duration-200 ease-out"
              style={{ transform: `rotate(${qiblaPointerRotation}deg)` }}
            >
              <div className={`absolute top-[22px] left-1/2 -translate-x-1/2 h-[45%] w-1.5 rounded-full transition-colors duration-300 ${isFacingQibla ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]' : 'bg-teal-500/40'}`} />
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full border-4 transition-colors duration-300 ${isFacingQibla ? 'border-emerald-400 bg-emerald-950 shadow-[0_0_30px_rgba(52,211,153,0.6)]' : 'border-teal-900 bg-slate-900'}`}>
                <span className="text-2xl drop-shadow-lg">🕋</span>
              </div>
            </div>

            {/* Titik Tengah HP */}
            <div className={`absolute h-4 w-4 rounded-full transition-colors duration-300 ring-4 ${isFacingQibla ? 'bg-emerald-400 ring-emerald-900' : 'bg-slate-400 ring-slate-800'}`} />
            
            {/* Garis bantu atas (Fix di UI, penunjuk HP) */}
            <div className={`absolute top-0 left-1/2 h-10 w-[3px] -translate-x-1/2 -translate-y-full transition-colors duration-300 ${isFacingQibla ? 'bg-emerald-400' : 'bg-slate-500/50'}`} />
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-xl border border-slate-800 bg-[#111923] p-6 text-center shadow-lg">
          <div className="text-[10px] text-slate-500 mb-2 font-bold tracking-widest">AZIMUTH KIBLAT</div>
          <div className="flex items-end justify-center gap-2 mb-6">
            <span className={`text-5xl font-bold transition-colors ${isFacingQibla ? 'text-emerald-400' : 'text-teal-400'}`}>
              {qibla.az.toFixed(1)}°
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-5">
            <div>
              <div className="text-[10px] text-slate-500 font-bold mb-1">HEADING HP</div>
              <div className="font-mono text-base text-slate-200">{Math.round(heading)}°</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold mb-1">JARAK KE KA'BAH</div>
              <div className="font-mono text-base text-slate-200">{Math.round(qibla.distance).toLocaleString('id-ID')} km</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
