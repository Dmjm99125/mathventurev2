import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card } from '@/components/ui';
import { CheckCircle2, XCircle, Trophy, Play } from 'lucide-react';
import { colorsData } from '@/data/colors';
import confetti from 'canvas-confetti';

interface MultipleChoiceProps {
  onComplete?: (score: number) => void;
}

export function MultipleChoice({ onComplete }: MultipleChoiceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<{ image: string; isCorrect: boolean } | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'feedback' | 'completed'>('playing');
  const [score, setScore] = useState(0);

  const question = colorsData[currentIndex];

  const handleSelect = (opt: { image: string; isCorrect: boolean }) => {
    if (gameState !== 'playing') return;
    
    setSelectedOption(opt);
    setGameState('feedback');
    
    if (opt.isCorrect) {
      setScore(s => s + 1);
      // Optional: Play a sound here
    }
  };

  const handleNext = () => {
    if (currentIndex < colorsData.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setGameState('playing');
    } else {
      setGameState('completed');
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  };

  if (gameState === 'completed') {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8">
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in duration-500 shadow-2xl border-4 border-jungle-yellow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-jungle-yellow/20 rounded-full blur-2xl" />
          <div className="w-24 h-24 bg-jungle-yellow text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-jungle-yellow/30">
            <Trophy className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-display font-extrabold mb-2 text-foreground">Excellent!</h1>
          <p className="text-xl font-bold text-muted-foreground mb-8">
            You scored {score} out of {colorsData.length}
          </p>
          <div className="flex flex-col gap-3">
            {onComplete && (
              <Button size="lg" variant="jungle" className="w-full text-lg shadow-md" onClick={() => onComplete(score)}>
                Continue <Play className="ml-2 w-5 h-5 fill-current" />
              </Button>
            )}
            <Button
              size="lg"
              variant="ghost"
              className="w-full font-bold"
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setGameState('playing');
                setSelectedOption(null);
              }}
            >
              Play Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl flex flex-col items-center bg-white/40 p-8 rounded-[2rem] shadow-sm border-2 border-white/50 backdrop-blur-sm min-h-[600px] justify-center">
      
      {/* Progress HUD */}
      <div className="w-full flex justify-between items-center mb-8 px-4">
        <div className="text-lg font-bold text-slate-500 bg-white/80 px-4 py-2 rounded-xl shadow-sm">
          Question {currentIndex + 1} of {colorsData.length}
        </div>
        <div className="text-lg font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl shadow-sm border border-emerald-200">
          Score: {score}
        </div>
      </div>

      {/* Question Prompt */}
      <div className="mb-12 text-center flex flex-col items-center gap-4">
        <h2
          className="text-3xl md:text-5xl font-display font-extrabold text-slate-800 drop-shadow-sm"
          dangerouslySetInnerHTML={{ __html: question.prompt || 'Choose the correct answer' }}
        />
      </div>

      {/* Options Grid */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-8 w-full max-w-3xl">
        {question.options.map((opt, i) => {
          const isSelected = selectedOption === opt;
          let stateClass = 'border-slate-200 hover:-translate-y-2 hover:border-sky-400 cursor-pointer bg-white';
          
          if (gameState === 'feedback') {
            if (isSelected) {
              stateClass = opt.isCorrect
                ? 'border-emerald-500 bg-emerald-50 scale-110 cursor-default shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'border-rose-500 bg-rose-50 cursor-default shadow-[0_0_20px_rgba(244,63,94,0.3)]';
            } else {
              stateClass = 'opacity-40 grayscale cursor-default bg-white border-slate-200';
            }
          }

          return (
            <motion.div
              key={i}
              whileHover={gameState === 'playing' ? { scale: 1.05 } : {}}
              whileTap={gameState === 'playing' ? { scale: 0.95 } : {}}
              onClick={() => handleSelect(opt)}
            >
              <Card
                className={`p-6 border-4 transition-all duration-300 flex items-center justify-center relative w-32 h-32 md:w-48 md:h-48 rounded-3xl ${stateClass}`}
              >
                <img
                  src={`/assets/images/${opt.image}`}
                  alt="option"
                  className="w-full h-full object-contain drop-shadow-md"
                />
                {gameState === 'feedback' && isSelected && opt.isCorrect && (
                  <CheckCircle2 className="absolute -top-4 -right-4 h-10 w-10 text-emerald-500 bg-white rounded-full p-1 shadow-md animate-in zoom-in" />
                )}
                {gameState === 'feedback' && isSelected && !opt.isCorrect && (
                  <XCircle className="absolute -top-4 -right-4 h-10 w-10 text-rose-500 bg-white rounded-full p-1 shadow-md animate-in zoom-in" />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Next button */}
      {gameState === 'feedback' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12"
        >
          <Button
            size="lg"
            variant={selectedOption?.isCorrect ? 'jungle' : 'secondary'}
            className="h-16 px-12 text-xl rounded-full shadow-lg"
            onClick={handleNext}
          >
            {selectedOption?.isCorrect ? 'Great! Next Question' : 'Try the next one'}{' '}
            <Play className="ml-2 h-6 w-6 fill-current" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
