'use client';

import { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, GraduationCap, RotateCcw, Timer, XCircle } from 'lucide-react';
import { Modal } from './Modal';
import { useAppStore } from '../lib/store';
import { useRealtimeAstro } from '../lib/useAstro';
import { fmtHM } from '../lib/falak/time';
import { buildQuiz, CATEGORY_LABELS, poolSize, type QuizCategory, type QuizQuestion } from '../lib/quiz/questions';

const BEST_KEY = 'astrofalak-quiz-best';
const TIME_PER_Q = 30;
const ALL_CATS = Object.keys(CATEGORY_LABELS) as QuizCategory[];

function grade(pct: number) {
  if (pct >= 85) return { label: 'Mumtaz (Istimewa)', color: 'text-emerald-300' };
  if (pct >= 70) return { label: 'Jayyid Jiddan (Sangat Baik)', color: 'text-cyan-300' };
  if (pct >= 55) return { label: 'Jayyid (Baik)', color: 'text-amber-300' };
  return { label: 'Perlu Belajar Lagi', color: 'text-rose-300' };
}

export function QuizModal() {
  const close = useAppStore((s) => s.closeModal);
  const openModal = useAppStore((s) => s.openModal);
  const { loc, sun, schedule, qibla } = useRealtimeAstro(1000);

  const [phase, setPhase] = useState<'setup' | 'play' | 'result'>('setup');
  const [cats, setCats] = useState<QuizCategory[]>(ALL_CATS);
  const [count, setCount] = useState(10);
  const [timed, setTimed] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
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
    setIdx(0);
    setSelected(null);
    setTimeLeft(TIME_PER_Q);
    setPhase('play');
  };

  const choose = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setAnswers((a) => a.map((v, k) => (k === idx ? i : v)));
  };

  // Hitung mundur per soal
  useEffect(() => {
    if (phase !== 'play' || !timed || selected !== null) return;
    if (timeLeft <= 0) {
      choose(-1);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timed, selected, timeLeft]);

  const score = answers.filter((a, i) => questions[i] && a === questions[i].answer).length;

  const next = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      setSelected(null);
      setTimeLeft(TIME_PER_Q);
    } else {
      const pct = Math.round((score / questions.length) * 100);
      if (best === null || pct > best) {
        localStorage.setItem(BEST_KEY, String(pct));
        setBest(pct);
      }
      setPhase('result');
    }
  };

  const q = questions[idx];
  const letters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <Modal title="Kuis Ilmu Falak" icon={<GraduationCap className="h-4 w-4 text-amber-400" />} onClose={close} maxWidth="max-w-2xl">
      <div className="font-quiz">
      {phase === 'setup' && (
        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
            <h3 className="text-base font-bold text-amber-200">Uji Pemahamanmu!</h3>
            <p className="mt-1 text-xs text-slate-300">
              Soal mencakup konsep bola langit, sistem koordinat, segitiga bola, waktu salat, dan arah kiblat.
              Kategori <b>“Soal dari Simulasi”</b> dibuat otomatis dari kondisi simulasi 3D saat ini ({loc.name}).
            </p>
            {best !== null && <p className="mt-2 flex items-center gap-1 text-xs text-amber-300"><Award className="h-3.5 w-3.5" /> Skor terbaik: {best}%</p>}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-300">Pilih Kategori</p>
            <div className="flex flex-wrap gap-2">
              {ALL_CATS.map((c) => {
                const on = cats.includes(c);
                return (
                  <button key={c} onClick={() => setCats(on ? cats.filter((x) => x !== c) : [...cats, c])}
                    className={`rounded-full border px-3 py-1 text-xs transition ${on ? 'border-amber-400 bg-amber-400/15 text-amber-200' : 'border-slate-700 text-slate-500'}`}>
                    {CATEGORY_LABELS[c]}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">{available} soal tersedia.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-300">Jumlah Soal</p>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`h-9 w-11 rounded-lg border text-sm font-semibold ${count === n ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-slate-700 text-slate-400'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="accent-amber-400" />
              <Timer className="h-3.5 w-3.5" /> Mode berwaktu ({TIME_PER_Q} detik/soal)
            </label>
          </div>

          <button onClick={start} disabled={cats.length === 0}
            className="w-full rounded-lg bg-amber-400 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-40">
            Mulai Kuis
          </button>
        </div>
      )}

      {phase === 'play' && q && (
        <div className="p-5">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <span>Soal {idx + 1} / {questions.length} · <span className="text-amber-300">{CATEGORY_LABELS[q.category]}</span></span>
            <span className="flex items-center gap-3">
              {timed && (
                <span className={`flex items-center gap-1 font-mono ${timeLeft <= 5 ? 'text-rose-400' : 'text-slate-300'}`}>
                  <Timer className="h-3.5 w-3.5" /> {timeLeft}s
                </span>
              )}
              <span>Skor: <b className="text-emerald-300">{score}</b></span>
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 transition-all" style={{ width: `${((idx + (selected !== null ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>

          <h3 className="mb-4 text-base font-semibold leading-snug text-slate-100">{q.question}</h3>

          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const isCorrect = i === q.answer;
              const isChosen = i === selected;
              let cls = 'border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800';
              if (selected !== null) {
                if (isCorrect) cls = 'border-emerald-500 bg-emerald-500/15 text-emerald-100';
                else if (isChosen) cls = 'border-rose-500 bg-rose-500/15 text-rose-100';
                else cls = 'border-slate-800 bg-slate-900 opacity-60';
              }
              return (
                <button key={i} onClick={() => choose(i)} disabled={selected !== null}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${cls}`}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-950/60 text-xs font-bold">{letters[i]}</span>
                  <span className="flex-1">{opt}</span>
                  {selected !== null && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {selected !== null && isChosen && !isCorrect && <XCircle className="h-4 w-4 text-rose-400" />}
                </button>
              );
            })}
          </div>

          {selected !== null && (
            <div className={`mt-4 rounded-lg border p-3 text-xs leading-relaxed ${selected === q.answer ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
              <p className="mb-1 font-semibold">
                {selected === q.answer ? '✅ Benar!' : selected === -1 ? '⏰ Waktu habis!' : '❌ Kurang tepat.'}
              </p>
              <p className="text-slate-300">{q.explanation}</p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button onClick={next} disabled={selected === null}
              className="rounded-lg bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-30">
              {idx + 1 < questions.length ? 'Lanjut →' : 'Lihat Hasil'}
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && (() => {
        const pct = Math.round((score / questions.length) * 100);
        const g = grade(pct);
        const wrong = questions.map((qq, i) => ({ qq, a: answers[i] })).filter((x) => x.a !== x.qq.answer);
        return (
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-5 text-center">
              <Award className="mx-auto h-10 w-10 text-amber-400" />
              <p className="mt-2 text-4xl font-bold">{pct}%</p>
              <p className="text-sm text-slate-400">{score} dari {questions.length} jawaban benar</p>
              <p className={`mt-1 text-sm font-semibold ${g.color}`}>{g.label}</p>
              {best !== null && <p className="mt-1 text-[11px] text-slate-500">Skor terbaik: {best}%</p>}
            </div>

            {wrong.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-300">Pembahasan soal yang belum tepat</p>
                <div className="space-y-2">
                  {wrong.map(({ qq, a }) => (
                    <div key={qq.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs">
                      <p className="font-semibold text-slate-200">{qq.question}</p>
                      <p className="mt-1 text-rose-300">Jawabanmu: {a === null || a === -1 ? '—' : qq.options[a]}</p>
                      <p className="text-emerald-300">Kunci: {qq.options[qq.answer]}</p>
                      <p className="mt-1 text-slate-400">{qq.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPhase('setup')} className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2 text-sm hover:bg-slate-800">
                <RotateCcw className="h-4 w-4" /> Ulangi Kuis
              </button>
              <button onClick={() => openModal({ type: 'learn' })} className="rounded-lg bg-violet-500 py-2 text-sm font-semibold text-white hover:bg-violet-400">
                Pelajari Materi
              </button>
            </div>
          </div>
        );
      })()}
      </div>
    </Modal>
  );
}
