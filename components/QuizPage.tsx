import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Globe,
  GraduationCap,
  Navigation,
  RotateCcw,
  Shapes,
  Sparkles,
  Timer,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRealtimeAstro } from '../lib/useAstro';
import { fmtHM } from '../lib/falak/time';
import { buildQuiz, CATEGORY_LABELS, poolSize, type QuizCategory, type QuizQuestion } from '../lib/quiz/questions';

const BEST_KEY = 'astrofalak-quiz-best';
const ALL_CATS = Object.keys(CATEGORY_LABELS) as QuizCategory[];
const letters = ['A', 'B', 'C', 'D'];

const CATEGORY_META: Record<
  QuizCategory,
  {
    icon: React.ReactNode;
    subtitle: string;
    gradient: string;
    borderActive: string;
    bgActive: string;
    textColor: string;
    tag: string;
  }
> = {
  'bola-langit': {
    icon: <Globe className="h-5 w-5" />,
    subtitle: 'Ufuk, Zenith & Lingkaran Bola Langit',
    gradient: 'from-cyan-500 to-blue-600',
    borderActive: 'border-cyan-400',
    bgActive: 'bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.18)]',
    textColor: 'text-cyan-300',
    tag: 'Astronomi Bola',
  },
  koordinat: {
    icon: <Compass className="h-5 w-5" />,
    subtitle: 'Tinggi (h), Azimuth, Deklinasi & RA',
    gradient: 'from-violet-500 to-indigo-600',
    borderActive: 'border-violet-400',
    bgActive: 'bg-violet-500/10 shadow-[0_0_20px_rgba(167,139,250,0.18)]',
    textColor: 'text-violet-300',
    tag: 'Sistem Koordinat',
  },
  'segitiga-bola': {
    icon: <Shapes className="h-5 w-5" />,
    subtitle: 'Segitiga Astronomis Kutub-Zenith-Matahari',
    gradient: 'from-fuchsia-500 to-pink-600',
    borderActive: 'border-fuchsia-400',
    bgActive: 'bg-fuchsia-500/10 shadow-[0_0_20px_rgba(232,121,249,0.18)]',
    textColor: 'text-fuchsia-300',
    tag: 'Trigonometri Falak',
  },
  'waktu-salat': {
    icon: <Clock className="h-5 w-5" />,
    subtitle: 'Hisab 5 Waktu, Ihtiyat & Kemenag RI',
    gradient: 'from-emerald-500 to-teal-600',
    borderActive: 'border-emerald-400',
    bgActive: 'bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.18)]',
    textColor: 'text-emerald-300',
    tag: 'Jadwal Salat',
  },
  kiblat: {
    icon: <Navigation className="h-5 w-5" />,
    subtitle: 'Azimuth Ka\'bah & Rashdul Qiblah',
    gradient: 'from-amber-500 to-orange-600',
    borderActive: 'border-amber-400',
    bgActive: 'bg-amber-500/10 shadow-[0_0_20px_rgba(251,191,36,0.18)]',
    textColor: 'text-amber-300',
    tag: 'Arah Kiblat',
  },
  simulasi: {
    icon: <Sparkles className="h-5 w-5" />,
    subtitle: 'Dihitung Live dari Koordinat Real-time',
    gradient: 'from-sky-500 to-cyan-600',
    borderActive: 'border-sky-400',
    bgActive: 'bg-sky-500/10 shadow-[0_0_20px_rgba(56,189,248,0.18)]',
    textColor: 'text-sky-300',
    tag: 'Kondisi 3D Nyata',
  },
};

function grade(pct: number) {
  if (pct >= 85) return { label: 'Mumtaz (Istimewa)', color: 'text-emerald-400' };
  if (pct >= 70) return { label: 'Jayyid Jiddan (Sangat Baik)', color: 'text-cyan-400' };
  if (pct >= 55) return { label: 'Jayyid (Baik)', color: 'text-amber-400' };
  return { label: 'Perlu Belajar Lagi', color: 'text-rose-400' };
}

export function QuizPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const { loc, sun, schedule, qibla } = useRealtimeAstro(1000);

  const [phase, setPhase] = useState<'setup' | 'play' | 'result'>('setup');
  const [cats, setCats] = useState<QuizCategory[]>(ALL_CATS);
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState<number | null>(30);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit ?? 0);
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    const b = localStorage.getItem(BEST_KEY);
    if (b) setBest(+b);
  }, []);

  const available = useMemo(() => poolSize(cats), [cats]);

  const start = () => {
    const get = (k: string) => schedule.entries.find((e) => e.key === k)?.time ?? NaN;
    const qs = buildQuiz(cats, count, {
      city: loc.name,
      qiblaAz: qibla.az,
      dzuhur: fmtHM(get('dzuhur')),
      maghrib: fmtHM(get('maghrib')),
      altitude: sun.altitude,
      declination: sun.dec,
      lat: loc.lat,
    });
    if (qs.length === 0) return;
    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setScore(0);
    setIdx(0);
    setSelected(null);
    setTimeLeft(timeLimit ?? 0);
    setPhase('play');
  };

  const choose = (i: number) => {
    setSelected(i);
    const newAns = [...answers];
    newAns[idx] = i;
    setAnswers(newAns);
    if (i === questions[idx].answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
      setTimeLeft(timeLimit ?? 0);
    } else {
      setPhase('result');
      const pct = Math.round((score / questions.length) * 100);
      if (best === null || pct > best) {
        setBest(pct);
        localStorage.setItem(BEST_KEY, pct.toString());
      }
    }
  };

  useEffect(() => {
    if (phase !== 'play' || timeLimit === null || selected !== null) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          choose(-1); // timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLimit, idx, selected]);

  const q = questions[idx];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0b141c] text-slate-200 font-quiz">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
        
        {/* HEADER ICON & TITLE */}
        <div className="mb-8 text-center">
          <div className="relative inline-flex items-center justify-center mb-4">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-500 opacity-60 blur-md" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 text-white shadow-2xl ring-1 ring-white/20">
              <GraduationCap className="h-8 w-8 drop-shadow" />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-black text-slate-950 shadow-md">
                ★
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">Kuis Astronomi Islam</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400 max-w-md mx-auto">
            Uji pemahaman Anda tentang ilmu falak, segitiga bola langit, arah kiblat, dan hisab waktu salat.
          </p>
          {best !== null && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Trophy className="h-3.5 w-3.5 text-amber-400" /> Skor Terbaik: {best}%
            </div>
          )}
        </div>

        {phase === 'setup' && (
          <div className="space-y-6">
            {/* KATEGORI */}
            <div className="rounded-2xl border border-slate-800 bg-[#14202c] p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
                  <CheckCircle2 className="h-4 w-4" /> Pilih Kategori Kuis
                </div>
                <button
                  onClick={() => setCats(cats.length === ALL_CATS.length ? [] : ALL_CATS)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition"
                >
                  {cats.length === ALL_CATS.length ? 'Hapus Semua' : 'Pilih Semua'}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ALL_CATS.map((c) => {
                  const isSelected = cats.includes(c);
                  const meta = CATEGORY_META[c];

                  return (
                    <button
                      key={c}
                      onClick={() => setCats(isSelected ? cats.filter((x) => x !== c) : [...cats, c])}
                      className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                        isSelected
                          ? `${meta.borderActive} ${meta.bgActive}`
                          : 'border-slate-800 bg-[#0f1722] text-slate-400 hover:border-slate-700 hover:bg-[#13202c]'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between mb-2.5">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-md transition-transform group-hover:scale-105 ${meta.gradient} text-white`}
                        >
                          {meta.icon}
                        </div>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold'
                              : 'border-slate-700 bg-slate-900/60 text-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <span className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                        {CATEGORY_LABELS[c]}
                      </span>
                      <span className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {meta.subtitle}
                      </span>
                      <span
                        className={`mt-2.5 inline-block rounded-md border px-2 py-0.5 text-[9px] font-semibold tracking-wide ${
                          isSelected
                            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                            : 'border-slate-800 bg-slate-900 text-slate-500'
                        }`}
                      >
                        {meta.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#14202c] p-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                <CheckCircle2 className="h-4 w-4" /> Konfigurasi Kuis
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-slate-400 mb-2 font-semibold">Jumlah Soal</div>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20].map((n) => (
                    <button
                      key={n}
                      disabled={n > available}
                      onClick={() => setCount(n)}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors disabled:opacity-30 ${
                        count === n ? 'border-cyan-500 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-2 font-semibold">Batas Waktu per Soal</div>
                <div className="flex flex-wrap gap-2">
                  {[10, 30, 60, null].map((t) => (
                    <button
                      key={t ?? 'null'}
                      onClick={() => setTimeLimit(t)}
                      className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                        timeLimit === t ? 'border-cyan-500 bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t === null ? 'Tidak Ada' : `${t}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-slate-900 p-3 text-[10px] leading-relaxed text-slate-500">
                <p>💡 {timeLimit ? `Setiap soal memiliki batas waktu ${timeLimit} detik.` : 'Tidak ada batas waktu.'}</p>
                <p>Banyak kategori mensyaratkan perhitungan waktu salat / arah kiblat (gunakan jawaban kasar).</p>
                <p>Penjelasan akan ditampilkan setelah Anda menjawab setiap pertanyaan.</p>
              </div>
            </div>

            <button
              disabled={cats.length === 0 || count > available}
              onClick={start}
              className="w-full rounded-xl bg-orange-500 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
            >
              Mulai Kuis &rarr;
            </button>
          </div>
        )}

        {phase === 'play' && q && (
          <div className="rounded-xl border border-slate-800 bg-[#14202c] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
              <span className="rounded-md bg-slate-900 px-3 py-1 font-bold">
                Soal {idx + 1} dari {questions.length}
              </span>
              <span className="font-semibold text-cyan-400">{CATEGORY_LABELS[q.category]}</span>
              {timeLimit !== null && (
                <span className={`flex items-center gap-1.5 font-mono ${timeLeft <= 5 ? 'text-rose-400' : 'text-slate-300'}`}>
                  <Timer className="h-4 w-4" /> {timeLeft}s
                </span>
              )}
            </div>

            <h3 className="mb-6 text-lg font-medium leading-relaxed text-slate-100">{q.question}</h3>

            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answer;
                const isChosen = i === selected;
                let cls = 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800';
                
                if (selected !== null) {
                  if (isCorrect) cls = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                  else if (isChosen) cls = 'border-rose-500 bg-rose-500/10 text-rose-400';
                  else cls = 'border-slate-800 bg-slate-900 opacity-50';
                }

                return (
                  <button
                    key={i}
                    disabled={selected !== null}
                    onClick={() => choose(i)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${cls}`}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-inherit text-xs font-bold">
                      {letters[i]}
                    </div>
                    <span className="text-sm">{opt}</span>
                    {selected !== null && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
                    {selected !== null && isChosen && !isCorrect && <XCircle className="ml-auto h-5 w-5 text-rose-500" />}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className={`mt-6 rounded-xl border p-4 text-xs leading-relaxed ${selected === q.answer ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
                <p className="mb-1 font-bold">
                  {selected === q.answer ? '✅ Benar!' : selected === -1 ? '⏱️ Waktu habis!' : '❌ Kurang tepat.'}
                </p>
                <p className="text-slate-300">{q.explanation}</p>
              </div>
            )}

            <div className="mt-8 flex justify-between items-center">
              <button onClick={() => setPhase('setup')} className="text-xs font-medium text-slate-500 hover:text-slate-300">
                Berhenti
              </button>
              <button
                disabled={selected === null}
                onClick={next}
                className="rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {idx === questions.length - 1 ? 'Lihat Hasil' : 'Selanjutnya'}
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && (() => {
          const pct = Math.round((score / questions.length) * 100);
          const res = grade(pct);
          return (
            <div className="space-y-6">
              <div className="text-center rounded-xl border border-slate-800 bg-[#14202c] p-8 shadow-xl">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 shadow-xl border-4 border-slate-800">
                  <Award className={`h-12 w-12 ${res.color}`} />
                </div>
                <h2 className={`mb-2 text-4xl font-bold ${res.color}`}>{pct}%</h2>
                <p className="mb-2 text-sm text-slate-400">Anda menjawab benar {score} dari {questions.length} soal.</p>
                <p className="mb-8 text-lg font-bold text-slate-200">{res.label}</p>
                
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <button
                    onClick={() => setPhase('setup')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <RotateCcw className="h-5 w-5" /> Ulangi Kuis
                  </button>
                  <button
                    onClick={() => setActivePage('home')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3.5 font-bold text-white transition-colors hover:bg-slate-700"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#14202c] p-6 shadow-xl">
                <h3 className="mb-4 text-lg font-bold text-white border-b border-slate-800 pb-3">Ringkasan Jawaban</h3>
                <div className="space-y-4">
                  {questions.map((q, i) => {
                    const ans = answers[i];
                    const isCorrect = ans === q.answer;
                    const isTimeout = ans === -1;
                    return (
                      <div key={i} className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
                        <div className="flex gap-3 items-start mb-2">
                          <div className="mt-0.5">
                            {isCorrect ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-rose-500" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-slate-200">
                            <span className="text-slate-500 mr-2">{i + 1}.</span>
                            {q.question}
                          </div>
                        </div>
                        
                        <div className="ml-8 mt-3 space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-slate-500 min-w-[100px]">Jawaban Anda:</span>
                            <span className={isCorrect ? 'text-emerald-400 font-bold' : isTimeout ? 'text-rose-400 font-italic' : 'text-rose-400 font-bold'}>
                              {isTimeout ? 'Waktu Habis / Tidak Dijawab' : q.options[ans!]}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div className="flex items-start gap-2">
                              <span className="text-slate-500 min-w-[100px]">Jawaban Benar:</span>
                              <span className="text-emerald-400 font-bold">{q.options[q.answer]}</span>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-slate-800/50 text-slate-400 leading-relaxed">
                            <span className="text-cyan-400 font-semibold mr-1">Penjelasan:</span>
                            {q.explanation}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
