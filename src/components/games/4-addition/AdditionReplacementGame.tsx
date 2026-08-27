import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { getBoundedAdditionOperands } from '@/lib/games/arithmeticBounds';

export type AdditionReplacementTheme = {
  title: string;
  subtitle: string;
  icon: string;
  promptIcon: string;
  optionIcons: string[];
  colors: { panel: string; border: string; accent: string; button: string };
};

export function AdditionReplacementGame({ theme, onComplete, allowSkip = true }: {
  theme: AdditionReplacementTheme;
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}) {
  // Skip navigation intentionally invokes onComplete() without scoring arguments (onClick={onComplete}).
  const [operands, setOperands] = useState<[number, number]>([1, 1]);
  const [choices, setChoices] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const maxRounds = 5;
  const answer = operands[0] + operands[1];

  const nextQuestion = () => {
    const next = getBoundedAdditionOperands();
    const correct = next[0] + next[1];
    const pool = new Set([correct]);
    while (pool.size < 3) pool.add(Math.max(2, Math.min(10, correct + (Math.random() > 0.5 ? 1 : -1) * (pool.size))));
    setOperands(next);
    setChoices([...pool].sort(() => Math.random() - 0.5));
    setSelected(null);
  };

  useEffect(() => { nextQuestion(); }, []);

  const choose = (choice: number) => {
    if (selected !== null || isCompleted) return;
    setSelected(choice);
    const newScore = score + (choice === answer ? 1 : 0);
    if (choice === answer) setScore(newScore);
    setTimeout(() => {
      if (round + 1 >= maxRounds) {
        if (allowSkip === false) setIsCompleted(true);
        else onComplete?.(newScore, maxRounds);
      }
      else { setRound(value => value + 1); nextQuestion(); }
    }, 700);
  };

  return (
    <div className={`w-full max-w-3xl mx-auto rounded-[2rem] border-8 ${theme.colors.border} ${theme.colors.panel} p-5 md:p-8 shadow-xl`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className={`text-2xl md:text-3xl font-black ${theme.colors.accent}`}>{theme.icon} {theme.title}</h2>
          <p className="font-bold text-slate-600">{theme.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold shadow-sm"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {score} / {maxRounds}</div>
          {onComplete && allowSkip !== false && <Button variant="outline" className="font-bold" onClick={() => onComplete?.()}>Skip Game</Button>}
        </div>
      </div>
      {!isCompleted ? (
        <>
          <div className="rounded-3xl bg-white p-6 text-center shadow-inner">
            <div className="mb-4 text-5xl md:text-7xl" aria-hidden="true">{theme.promptIcon}</div>
            <div className="text-5xl md:text-7xl font-black text-slate-700">{operands[0]} <span className={theme.colors.accent}>+</span> {operands[1]} <span className={theme.colors.accent}>=</span> ?</div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {choices.map((choice, index) => {
                const correct = selected !== null && choice === answer;
                const wrong = selected === choice && choice !== answer;
                return <button key={`${choice}-${index}`} onClick={() => choose(choice)} className={`rounded-2xl border-4 p-3 text-3xl font-black transition-transform hover:scale-105 ${correct ? 'border-emerald-500 bg-emerald-100 text-emerald-700' : wrong ? 'border-rose-500 bg-rose-100 text-rose-700' : `${theme.colors.button} text-white`}`}>
                  {theme.optionIcons[index]} {choice}
                  {correct && <CheckCircle2 className="mx-auto mt-1 h-5 w-5" />}
                  {wrong && <XCircle className="mx-auto mt-1 h-5 w-5" />}
                </button>;
              })}
            </div>
          </div>
          {selected !== null && <p className="mt-4 text-center text-xl font-black">{selected === answer ? 'Correct!' : `The answer is ${answer}.`}</p>}
          <Button variant="outline" className="mt-5" onClick={nextQuestion}><RotateCcw className="mr-2 h-4 w-4" /> New problem</Button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-inner">
          <div className="text-6xl" aria-hidden="true">🏆</div>
          <h3 className={`text-3xl font-black ${theme.colors.accent}`}>Game Complete!</h3>
          <p className="text-lg font-bold text-slate-600">You completed all {maxRounds} rounds.</p>
          {onComplete && allowSkip === false && (
            <Button className={`${theme.colors.button} font-bold text-white`} onClick={() => onComplete?.(score, maxRounds)}>Continue to Next Game</Button>
          )}
        </div>
      )}
    </div>
  );
}
