import { useEffect, useState } from 'react';
import { CheckCircle2, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export type NumberReplacementTheme = {
  title: string;
  subtitle: string;
  icon: string;
  item: string;
  answerLabel: string;
  colors: { panel: string; border: string; button: string };
};

export function NumberReplacementGame({ theme, onComplete, allowSkip = true }: { theme: NumberReplacementTheme; onComplete?: () => void; allowSkip?: boolean }) {
  const [target, setTarget] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const maxRounds = 5;

  const nextRound = () => {
    setTarget(Math.floor(Math.random() * 5) + 1);
    setSelected(null);
  };
  useEffect(() => { nextRound(); }, []);

  const choose = (value: number) => {
    if (selected !== null) return;
    setSelected(value);
    if (value === target) setScore(value => value + 1);
    setTimeout(() => {
      if (round + 1 >= maxRounds) onComplete?.();
      else { setRound(value => value + 1); nextRound(); }
    }, 650);
  };

  return <div className={`w-full max-w-3xl mx-auto rounded-[2rem] border-8 ${theme.colors.border} ${theme.colors.panel} p-5 md:p-8 shadow-xl`}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black text-slate-800">{theme.icon} {theme.title}</h2><p className="font-bold text-slate-600">{theme.subtitle}</p></div>
      <div className="flex items-center gap-2"><div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold shadow-sm"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {score} / {maxRounds}</div>{onComplete && allowSkip !== false && <Button variant="outline" onClick={onComplete}>Skip Game</Button>}</div>
    </div>
    <div className="rounded-3xl bg-white p-6 text-center shadow-inner">
      <div className="mb-4 flex min-h-24 flex-wrap justify-center gap-2 text-5xl" aria-label={`${theme.answerLabel}: ${target}`}>{Array.from({ length: target }, (_, i) => <span key={i}>{theme.item}</span>)}</div>
      <p className="mb-5 text-xl font-black text-slate-700">{theme.answerLabel}</p>
      <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map(value => { const correct = selected !== null && value === target; const wrong = selected === value && value !== target; return <button key={value} onClick={() => choose(value)} className={`rounded-2xl border-4 p-3 text-2xl font-black text-white ${correct ? 'border-emerald-500 bg-emerald-500' : wrong ? 'border-rose-500 bg-rose-500' : theme.colors.button}`}>{value}{correct && <CheckCircle2 className="mx-auto h-4 w-4" />}{wrong && <XCircle className="mx-auto h-4 w-4" />}</button>; })}</div>
    </div>
  </div>;
}
