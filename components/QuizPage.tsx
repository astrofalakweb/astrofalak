import { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, GraduationCap, RotateCcw, Timer, XCircle } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { fmtHM } from '../lib/falak/time';
import { buildQuiz, CATEGORY_LABELS, poolSize, type QuizCategory, type QuizQuestion } from '../lib/quiz/questions';

const BEST_KEY = 'astrofalak-quiz-best';
const ALL_CATS = Object.keys(CATEGORY_LABELS) as QuizCategory[];
const letters = ['A', 'B', 'C', 'D'];

function grade(pct: number) {
  if (pct >= 85) return { label: 'Mumtaz (Istimewa)', color: 'text-emerald-400' };
  if (pct >= 70) return { label: 'Jayyid Jiddan (Sangat Baik)', color: 'text-cyan-400' };
  if (pct >= 55) return { label: 'Jayyid (Baik)', color: 'text-amber-400' };
  return { label: 'Perlu Belajar Lagi', color: 'text-rose-400' };
}

export function QuizPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const { loc, sun, schedule, qibla } = useAstro();

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
  }, [phase, timeLimit, idx, selected]);

  const q = questions[idx];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0b141c] text-slate-200 font-sans">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
        
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white mb-3 shadow-lg shadow-orange-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Kuis Astronomi Islam</h1>
          <p className="mt-2 text-xs text-slate-400">Pilih kategori dan tingkat kesulitan kuis untuk menguji pemahaman Anda tentang ilmu falak dan astronomi.</p>
        </div>

        {phase === 'setup' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-800 bg-[#14202c] p-5">
              <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                <CheckCircle2 className="h-4 w-4" /> Kategori
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ALL_CATS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c])}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
                      cats.includes(c) ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Award className="h-5 w-5" />
                    <span className="text-[10px] font-semibold">{CATEGORY_LABELS[c]}</span>
                  </button>
                ))}
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
