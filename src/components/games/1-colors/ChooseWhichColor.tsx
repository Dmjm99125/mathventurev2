import React, { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { CheckCircle2, XCircle, Play } from 'lucide-react';
import { colorsData } from '@/data/colors';
import confetti from 'canvas-confetti';

interface ChooseWhichColorProps {
  onComplete?: () => void;
}

export function ChooseWhichColor({ onComplete }: ChooseWhichColorProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'completed'>('playing');

  const questions = colorsData;
  const question = questions[internalIndex];

  const handleSelect = (opt: any) => {
    if (gameState === 'feedback') return;
    setSelectedOption(opt);
    setGameState('feedback');
    if (opt.isCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleNext = () => {
    if (selectedOption?.isCorrect) {
      if (internalIndex < questions.length - 1) {
        setInternalIndex(prev => prev + 1);
        setSelectedOption(null);
        setGameState('playing');
      } else {
        setGameState('completed');
      }
    } else {
      setSelectedOption(null);
      setGameState('playing');
    }
  };

  if (gameState === 'completed') {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-12 bg-gradient-to-b from-green-50 to-emerald-100 rounded-3xl min-h-[500px] border-4 border-emerald-200 shadow-xl animate-in zoom-in">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-emerald-600 mb-6 drop-shadow-sm text-center">
          Congratulations! 🎉
        </h1>
        <p className="text-2xl text-emerald-800 mb-10 text-center font-bold">
          You have successfully completed all the color challenges!
        </p>
        {onComplete && (
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-2xl py-8 rounded-2xl px-16 shadow-[0_6px_0_0_#e68a00] hover:-translate-y-1 transition-all" onClick={onComplete}>
            Return to Main Menu ➡️
          </Button>
        )}
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="w-full max-w-5xl flex flex-col items-center mx-auto bg-sky-50/80 p-6 pb-12 md:p-12 md:pb-16 rounded-3xl shadow-lg min-h-[600px] h-fit shrink-0 border-4 border-sky-100 animate-in fade-in relative">
      
      {/* Top Header */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
         <span className="text-xl md:text-2xl font-bold text-sky-700 bg-white px-6 py-3 rounded-2xl shadow-sm border-2 border-sky-200">
            Question {internalIndex + 1} of {questions.length}
         </span>
         {onComplete && (
            <Button variant="outline" className="text-sky-600 border-2 border-sky-200 hover:bg-sky-100 font-bold text-lg rounded-xl" onClick={onComplete}>
              Skip to End ➡️
            </Button>
         )}
      </div>

      {/* Question Prompt */}
      <div className="mb-12 text-center flex flex-col items-center gap-4">
        <h2
          className="text-3xl md:text-5xl font-display font-extrabold text-slate-800 leading-tight drop-shadow-sm"
          dangerouslySetInnerHTML={{ __html: question.prompt }}
        />
      </div>

      {/* Options Grid */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-10">
        {question.options.map((opt, i) => {
          const isSelected = selectedOption === opt;
          let stateClass = 'border-sky-200 hover:-translate-y-2 hover:border-sky-400 cursor-pointer bg-white hover:shadow-xl';

          if (gameState === 'feedback') {
            if (isSelected) {
              stateClass = opt.isCorrect
                ? 'border-green-500 bg-green-50 scale-110 cursor-default shadow-xl ring-4 ring-green-500/30'
                : 'border-red-500 bg-red-50 cursor-default ring-4 ring-red-500/30';
            } else {
              stateClass = 'opacity-50 grayscale cursor-default bg-white border-slate-200 scale-95';
            }
          }

          return (
            <Card
              key={i}
              className={`p-6 md:p-8 border-4 transition-all duration-300 flex items-center justify-center relative shadow-md ${stateClass} rounded-3xl`}
              onClick={() => handleSelect(opt)}
            >
              <img
                src={`/assets/images/${opt.image}`}
                alt="option"
                className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-md transition-transform"
              />
              {gameState === 'feedback' && isSelected && opt.isCorrect && (
                <CheckCircle2 className="absolute top-4 right-4 h-12 w-12 text-green-500 animate-in zoom-in drop-shadow-sm bg-white rounded-full" />
              )}
              {gameState === 'feedback' && isSelected && !opt.isCorrect && (
                <XCircle className="absolute top-4 right-4 h-12 w-12 text-red-500 animate-in zoom-in drop-shadow-sm bg-white rounded-full" />
              )}
            </Card>
          );
        })}
      </div>

      {/* Next button */}
      {gameState === 'feedback' && (
        <div className="mt-12 mb-8 animate-in fade-in slide-in-from-bottom-8">
          <Button
            size="lg"
            variant={selectedOption?.isCorrect ? 'jungle' : 'secondary'}
            className="h-16 md:h-20 px-12 md:px-16 text-2xl md:text-3xl rounded-full shadow-[0_6px_0_0_rgba(0,0,0,0.1)] font-bold transition-transform hover:scale-105 active:scale-95"
            onClick={handleNext}
          >
            {selectedOption?.isCorrect ? 'Great! Next' : 'Try Again'}{' '}
            <Play className="ml-3 h-8 w-8 md:h-10 md:w-10 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );
}
