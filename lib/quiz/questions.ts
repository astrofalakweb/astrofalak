export type QuizCategory = 'bola-langit' | 'koordinat' | 'segitiga-bola' | 'waktu-salat' | 'kiblat' | 'simulasi';

export const CATEGORY_LABELS: Record<QuizCategory, string> = {
  'bola-langit': 'Bola Langit',
  koordinat: 'Sistem Koordinat',
  'segitiga-bola': 'Segitiga Bola',
  'waktu-salat': 'Waktu Salat',
  kiblat: 'Arah Kiblat',
  simulasi: 'Soal dari Simulasi',
};

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const BANK: QuizQuestion[] = [
  {
    id: 'bl1', category: 'bola-langit',
    question: 'Titik pada bola langit yang tepat berada di atas kepala pengamat disebut…',
    options: ['Zenith', 'Nadir', 'Kutub Langit Utara', 'Titik Aries'], answer: 0,
    explanation: 'Zenith adalah titik tertinggi tepat di atas pengamat (h = 90°). Kebalikannya, tepat di bawah kaki, disebut Nadir.',
  },
  {
    id: 'bl2', category: 'bola-langit',
    question: 'Lingkaran besar yang membagi bola langit menjadi belahan yang tampak dan tidak tampak bagi pengamat adalah…',
    options: ['Ekuator langit', 'Ufuk (horizon)', 'Meridian', 'Ekliptika'], answer: 1,
    explanation: 'Ufuk/horizon adalah lingkaran besar yang berjarak 90° dari zenith; benda di atasnya terlihat, di bawahnya tidak.',
  },
  {
    id: 'bl3', category: 'bola-langit',
    question: 'Kemiringan bidang ekliptika terhadap ekuator langit adalah sekitar…',
    options: ['23,44°', '66,56°', '90°', '21,42°'], answer: 0,
    explanation: 'Sumbu rotasi bumi miring ±23,44° sehingga lintasan tahunan matahari (ekliptika) membentuk sudut 23,44° terhadap ekuator langit.',
  },
  {
    id: 'bl4', category: 'bola-langit',
    question: 'Tinggi kutub langit di atas ufuk selalu sama dengan…',
    options: ['Deklinasi matahari', 'Lintang tempat pengamat (φ)', 'Bujur tempat pengamat', 'Azimuth kiblat'], answer: 1,
    explanation: 'Tinggi kutub langit = φ. Karena itu pengamat di Jakarta (φ ≈ −6,2°) melihat Kutub Langit Selatan setinggi 6,2° di atas ufuk.',
  },
  {
    id: 'bl5', category: 'bola-langit',
    question: 'Deklinasi matahari mencapai nilai maksimum +23,44° pada saat…',
    options: ['Ekuinoks Maret', 'Solstis Juni', 'Ekuinoks September', 'Solstis Desember'], answer: 1,
    explanation: 'Sekitar 21 Juni matahari berada di titik balik utara (δ = +23,44°). Pada 21 Desember di titik balik selatan (δ = −23,44°).',
  },
  {
    id: 'ko1', category: 'koordinat',
    question: 'Dalam ilmu falak di Indonesia, azimuth umumnya diukur dari titik … searah jarum jam.',
    options: ['Utara', 'Selatan', 'Timur', 'Zenith'], answer: 0,
    explanation: 'Azimuth diukur dari Utara (0°) → Timur (90°) → Selatan (180°) → Barat (270°).',
  },
  {
    id: 'ko2', category: 'koordinat',
    question: 'Pasangan koordinat yang digunakan dalam sistem koordinat horizon adalah…',
    options: ['Tinggi (h) dan Azimuth (Az)', 'Deklinasi (δ) dan Asensio Rekta (α)', 'Lintang dan Bujur ekliptika', 'Sudut waktu (t) dan Deklinasi (δ)'], answer: 0,
    explanation: 'Sistem horizon memakai ufuk sebagai bidang dasar: tinggi diukur dari ufuk, azimuth diukur sepanjang ufuk.',
  },
  {
    id: 'ko3', category: 'koordinat',
    question: 'Sudut waktu (t) matahari bernilai 0° ketika matahari…',
    options: ['Berkulminasi di meridian', 'Terbit', 'Terbenam', 'Berada di titik nadir'], answer: 0,
    explanation: 't = 0° saat benda langit melintasi meridian atas (kulminasi). Bernilai negatif sebelum kulminasi dan positif sesudahnya.',
  },
  {
    id: 'ko4', category: 'koordinat',
    question: 'Hubungan antara sudut waktu (t), waktu bintang lokal (LST), dan asensio rekta (α) adalah…',
    options: ['t = LST − α', 't = α − LST', 't = LST + α', 't = 90° − α'], answer: 0,
    explanation: 'Sudut waktu lokal = Waktu Bintang Lokal dikurangi Asensio Rekta benda langit.',
  },
  {
    id: 'sb1', category: 'segitiga-bola',
    question: 'Tiga titik sudut segitiga bola (segitiga astronomis) untuk menghitung posisi matahari adalah…',
    options: ['Zenith, Kutub Langit, Matahari', 'Zenith, Nadir, Matahari', 'Titik Timur, Titik Barat, Matahari', "Kutub Utara, Kutub Selatan, Ka'bah"], answer: 0,
    explanation: 'Segitiga astronomis dibentuk oleh Zenith (Z), Kutub Langit (P), dan benda langit (M).',
  },
  {
    id: 'sb2', category: 'segitiga-bola',
    question: 'Pada segitiga Z–KLU–M, panjang sisi Zenith ke Kutub Langit Utara adalah…',
    options: ['90° − φ', '90° − δ', '90° − h', 't'], answer: 0,
    explanation: 'ZP = 90° − φ (kolintang), PM = 90° − δ (jarak kutub), ZM = 90° − h (jarak zenith).',
  },
  {
    id: 'sb3', category: 'segitiga-bola',
    question: 'Rumus cosinus segitiga bola untuk menghitung tinggi matahari adalah…',
    options: ['sin h = sin φ sin δ + cos φ cos δ cos t', 'cos h = sin φ + cos δ', 'tan h = tan φ tan δ', 'sin h = cos φ cos δ'], answer: 0,
    explanation: 'Dari aturan cosinus: cos(90°−h) = cos(90°−φ)cos(90°−δ) + sin(90°−φ)sin(90°−δ)cos t.',
  },
  {
    id: 'sb4', category: 'segitiga-bola',
    question: 'Sudut di titik Kutub Langit (P) pada segitiga astronomis adalah…',
    options: ['Sudut waktu (t)', 'Azimuth', 'Deklinasi', 'Lintang tempat'], answer: 0,
    explanation: 'Sudut pada P adalah sudut waktu t, sedangkan sudut pada Z berkaitan dengan azimuth.',
  },
  {
    id: 'ws1', category: 'waktu-salat',
    question: 'Kriteria Kemenag RI untuk awal waktu Subuh adalah tinggi matahari…',
    options: ['−20°', '−18°', '−1°', '+4,5°'], answer: 0,
    explanation: 'Kemenag RI menetapkan awal Subuh saat matahari berada 20° di bawah ufuk (fajar shadiq).',
  },
  {
    id: 'ws2', category: 'waktu-salat',
    question: 'Kriteria Kemenag RI untuk awal waktu Isya adalah tinggi matahari…',
    options: ['−18°', '−20°', '−1°', '0°'], answer: 0,
    explanation: 'Awal Isya ditandai hilangnya mega merah (syafaq), yakni saat h = −18°.',
  },
  {
    id: 'ws3', category: 'waktu-salat',
    question: 'Tinggi matahari saat Maghrib (≈ −1°) memperhitungkan faktor…',
    options: ['Refraksi, semidiameter matahari, dan kerendahan ufuk', 'Hanya deklinasi', 'Perata waktu', 'Arah kiblat'], answer: 0,
    explanation: 'Piringan atas matahari tepat di ufuk setelah dikoreksi refraksi (~34′), semidiameter (~16′), dan kerendahan ufuk.',
  },
  {
    id: 'ws4', category: 'waktu-salat',
    question: 'Rumus tinggi matahari awal waktu Ashar adalah…',
    options: ['cot h = 1 + tan|φ − δ|', 'h = −18°', 'h = 90° − φ', 'tan h = 2'], answer: 0,
    explanation: 'Awal Ashar: panjang bayangan = panjang benda + bayangan saat kulminasi, sehingga cot h = 1 + tan|φ − δ|.',
  },
  {
    id: 'ws5', category: 'waktu-salat',
    question: 'Ihtiyat (waktu pengaman) yang umum digunakan Kemenag RI adalah…',
    options: ['2 menit', '10 menit', '30 detik', '15 menit'], answer: 0,
    explanation: 'Ihtiyat 2 menit ditambahkan agar jadwal aman digunakan di seluruh wilayah kota/kabupaten.',
  },
  {
    id: 'ws6', category: 'waktu-salat',
    question: 'Waktu Dzuhur dimulai sesaat setelah matahari…',
    options: ['Berkulminasi (melewati meridian)', 'Terbit', 'Terbenam', 'Mencapai h = −18°'], answer: 0,
    explanation: 'Dzuhur dimulai setelah zawal, yaitu matahari tergelincir dari titik kulminasi.',
  },
  {
    id: 'ws7', category: 'waktu-salat',
    question: 'Perata waktu (Equation of Time) adalah selisih antara…',
    options: ['Waktu matahari hakiki dan waktu matahari pertengahan', 'WIB dan UTC', 'Waktu terbit dan terbenam', 'Waktu Subuh dan Imsak'], answer: 0,
    explanation: 'Akibat orbit elips & kemiringan sumbu bumi, matahari hakiki bisa lebih cepat/lambat hingga ±16 menit dari matahari rata-rata.',
  },
  {
    id: 'ws8', category: 'waktu-salat',
    question: 'Rumus waktu kulminasi (transit) matahari dalam waktu daerah adalah…',
    options: ['12 − e + (λ_daerah − λ)/15', '12 + e', '6 + t/15', '12 − φ/15'], answer: 0,
    explanation: 'Transit = 12:00 − perata waktu + koreksi bujur. Contoh WIB: λ_daerah = 105°.',
  },
  {
    id: 'kb1', category: 'kiblat',
    question: "Koordinat Ka'bah yang umum digunakan dalam hisab arah kiblat adalah…",
    options: ["21° 25′ LU, 39° 50′ BT", "6° 10′ LS, 106° 49′ BT", "24° 28′ LU, 39° 36′ BT", "0°, 0°"], answer: 0,
    explanation: "Ka'bah terletak di sekitar φ = 21,4225° LU dan λ = 39,8262° BT.",
  },
  {
    id: 'kb2', category: 'kiblat',
    question: 'Peristiwa Rashdul Qiblah terjadi ketika…',
    options: ["Matahari tepat di atas Ka'bah sehingga bayangan benda tegak menunjuk kiblat", 'Bulan purnama', 'Matahari di ekuator langit', 'Terjadi gerhana matahari'], answer: 0,
    explanation: "Setiap ±28 Mei (16:18 WIB) dan ±16 Juli (16:27 WIB) matahari berada di zenith Ka'bah; bayangan benda tegak mengarah ke kiblat.",
  },
  {
    id: 'kb3', category: 'kiblat',
    question: 'Arah kiblat dihitung menggunakan…',
    options: ["Segitiga bola antara Kutub Utara, lokasi, dan Ka'bah", 'Garis lurus pada peta Mercator', 'Selisih zona waktu', 'Tinggi matahari saat Dzuhur'], answer: 0,
    explanation: "Arah kiblat adalah arah lingkaran besar terpendek; dihitung dengan trigonometri bola: tan Q = sin Δλ / (cos φ tan φk − sin φ cos Δλ).",
  },
];

export interface QuizContext {
  city: string;
  qiblaAz: number;
  dzuhur: string;
  maghrib: string;
  altitude: number;
  declination: number;
  lat: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(q: QuizQuestion): QuizQuestion {
  const order = shuffle(q.options.map((_, i) => i));
  return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) };
}

function shiftHM(hm: string, min: number): string {
  const [h, m] = hm.split(':').map(Number);
  const t = (((h * 60 + m + min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function distinct(correct: string, candidates: string[], need = 3): string[] {
  const out: string[] = [];
  for (const c of candidates) if (c !== correct && !out.includes(c)) out.push(c);
  return out.slice(0, need);
}

function dynamicQuestions(ctx: QuizContext): QuizQuestion[] {
  const n360 = (a: number) => ((a % 360) + 360) % 360;
  const q = ctx.qiblaAz;
  const qStr = `${q.toFixed(1)}°`;
  const dec = ctx.declination;
  const decStr = `${dec.toFixed(1)}°`;
  const list: QuizQuestion[] = [
    {
      id: 'sim-qibla', category: 'simulasi',
      question: `Berdasarkan simulasi, berapakah azimuth arah kiblat untuk ${ctx.city}?`,
      options: [qStr, ...distinct(qStr, [`${n360(q + 18.5).toFixed(1)}°`, `${n360(q - 23.7).toFixed(1)}°`, `${n360(360 - q).toFixed(1)}°`, `${n360(q + 41).toFixed(1)}°`])],
      answer: 0,
      explanation: `Azimuth kiblat ${ctx.city} = ${qStr} dari Utara searah jarum jam. Lihat panah jingga pada bola langit.`,
    },
    {
      id: 'sim-dzuhur', category: 'simulasi',
      question: `Pukul berapakah awal waktu Dzuhur di ${ctx.city} pada tanggal simulasi?`,
      options: [ctx.dzuhur, ...distinct(ctx.dzuhur, [shiftHM(ctx.dzuhur, 23), shiftHM(ctx.dzuhur, -31), '12:00', shiftHM(ctx.dzuhur, 47)])],
      answer: 0,
      explanation: `Dzuhur = waktu transit + ihtiyat 2 menit = ${ctx.dzuhur}. Cek di panel jadwal salat.`,
    },
    {
      id: 'sim-maghrib', category: 'simulasi',
      question: `Pukul berapakah awal waktu Maghrib di ${ctx.city} pada tanggal simulasi?`,
      options: [ctx.maghrib, ...distinct(ctx.maghrib, [shiftHM(ctx.maghrib, 19), shiftHM(ctx.maghrib, -27), '18:00', shiftHM(ctx.maghrib, 52)])],
      answer: 0,
      explanation: `Maghrib terjadi saat h = −1° (ditambah ihtiyat) = ${ctx.maghrib}.`,
    },
    {
      id: 'sim-dec', category: 'simulasi',
      question: 'Berapakah deklinasi matahari pada waktu simulasi saat ini?',
      options: [decStr, ...distinct(decStr, [`${(-dec).toFixed(1)}°`, `${(dec + 11.3).toFixed(1)}°`, `${(dec - 9.6).toFixed(1)}°`, `${ctx.lat.toFixed(1)}°`])],
      answer: 0,
      explanation: `Deklinasi saat ini ${decStr} — lihat kotak hijau di Telemetry HUD.`,
    },
    {
      id: 'sim-up', category: 'simulasi',
      question: 'Pada waktu simulasi saat ini, di manakah posisi matahari bagi pengamat?',
      options: ['Di atas ufuk', 'Di bawah ufuk'],
      answer: ctx.altitude > 0 ? 0 : 1,
      explanation: `Tinggi matahari saat ini ${ctx.altitude.toFixed(2)}°, sehingga matahari ${ctx.altitude > 0 ? 'di atas' : 'di bawah'} ufuk.`,
    },
    {
      id: 'sim-hemi', category: 'simulasi',
      question: 'Saat ini matahari berada di belahan langit mana relatif terhadap ekuator langit?',
      options: ['Utara ekuator (δ positif)', 'Selatan ekuator (δ negatif)'],
      answer: dec >= 0 ? 0 : 1,
      explanation: `δ = ${decStr}, jadi matahari berada di ${dec >= 0 ? 'utara' : 'selatan'} ekuator langit.`,
    },
  ];
  return list;
}

export function buildQuiz(categories: QuizCategory[], count: number, ctx: QuizContext): QuizQuestion[] {
  const pool = [...BANK, ...dynamicQuestions(ctx)].filter((q) => categories.includes(q.category));
  return shuffle(pool).slice(0, count).map(shuffleOptions);
}

export function poolSize(categories: QuizCategory[]): number {
  return BANK.filter((q) => categories.includes(q.category)).length + (categories.includes('simulasi') ? 6 : 0);
}
