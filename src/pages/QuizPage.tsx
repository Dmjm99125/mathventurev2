import React, { useState, useEffect } from 'react';
import { useRoute, useSearch, useLocation } from 'wouter';
import { allTopics } from '@/data';
import { freePlayTopics } from '@/data/freePlay';
import { GameLayout } from '@/components/GameLayout';
import { AudioButton } from '@/components/AudioButton';
import { Card, Button } from '@/components/ui';
import { CheckCircle2, XCircle, Trophy, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSubmitAttempt } from '@/lib/hooks';

export function QuizPage() {
  const [, params] = useRoute('/student/lessons/:topic');
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const topic = params?.topic || 'colors';
  const [, setLocation] = useLocation();
  const submitAttempt = useSubmitAttempt();

  const questions = assignmentId 
    ? (allTopics[topic as keyof typeof allTopics] || [])
    : (freePlayTopics[topic as keyof typeof freePlayTopics] || []);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'feedback' | 'completed'>('intro');
  const [selectedOption, setSelectedOption] = useState<{ image: string, isCorrect: boolean } | null>(null);
  
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const question = questions[currentIndex];

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleSelect = (option: { image: string, isCorrect: boolean }) => {
    if (gameState !== 'playing') return;
    setSelectedOption(option);
    setGameState('feedback');
    if (option.isCorrect) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setGameState('playing');
    } else {
      // Completed!
      setGameState('completed');
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const maxScore = questions.length;
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#eab308', '#f97316']
      });

      try {
        await submitAttempt.mutateAsync({
          lessonId: topic, // Using topic as lessonId in hardcoded model
          assignmentId,
          score: score + (selectedOption?.isCorrect ? 1 : 0),
          maxScore,
          durationSeconds
        });
      } catch (e) {
        console.error("Failed to submit score", e);
      }
    }
  };

  if (!questions.length) {
    return (
      <GameLayout topic={topic} title="Coming Soon">
        <Card className="p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Under Construction</h2>
          <p className="text-muted-foreground mb-8">This chapter's questions are being built!</p>
          <Button onClick={() => setLocation('/student/lessons')}>Go Back</Button>
        </Card>
      </GameLayout>
    );
  }

  return (
    <GameLayout topic={topic} title={`Chapter: ${topic}`}>
      
      {gameState === 'intro' && (
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500 shadow-2xl border-4 border-primary">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4 capitalize">{topic}</h1>
          <p className="text-lg text-muted-foreground font-bold mb-8">
            Get ready to practice {topic}!
          </p>
          <Button size="lg" variant="jungle" className="w-full text-xl h-16 rounded-full shadow-lg" onClick={startGame}>
            Start <Play className="ml-2 h-6 w-6 fill-current" />
          </Button>
        </Card>
      )}

      {(gameState === 'playing' || gameState === 'feedback') && question && (
        <div className="w-full max-w-5xl flex flex-col items-center">
          {/* Question Prompt */}
          <div className="mb-12 text-center flex flex-col items-center gap-4">
            <h2 className="text-3xl md:text-5xl font-display font-extrabold text-foreground" dangerouslySetInnerHTML={{ __html: question.prompt || 'Choose the correct answer' }} />
            {/* If audio file mapped to this topic exists, play it. Using dummy for now as no audio is extracted cleanly */}
            {topic === 'colors' && currentIndex === 0 && <AudioButton src={`/assets/audio/audio/1red.MP3`} />}
          </div>

          {/* Options Grid */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {question.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              let stateClass = "border-border hover:-translate-y-2 hover:border-primary cursor-pointer";
              
              if (gameState === 'feedback') {
                if (isSelected) {
                  stateClass = opt.isCorrect 
                    ? "border-primary bg-primary/10 scale-110 cursor-default" 
                    : "border-destructive bg-destructive/10 cursor-default";
                } else {
                  stateClass = "opacity-50 grayscale cursor-default";
                }
              }

              return (
                <Card 
                  key={i}
                  className={`p-6 border-4 transition-all duration-300 flex items-center justify-center ${stateClass}`}
                  onClick={() => handleSelect(opt)}
                >
                  <img src={`/assets/images/${opt.image}`} alt="option" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />
                  
                  {gameState === 'feedback' && isSelected && opt.isCorrect && (
                    <CheckCircle2 className="absolute top-2 right-2 h-8 w-8 text-primary animate-in zoom-in" />
                  )}
                  {gameState === 'feedback' && isSelected && !opt.isCorrect && (
                    <XCircle className="absolute top-2 right-2 h-8 w-8 text-destructive animate-in zoom-in" />
                  )}
                </Card>
              );
            })}
          </div>

          {/* Next Button when feedback is showing */}
          {gameState === 'feedback' && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4">
              <Button size="lg" variant={selectedOption?.isCorrect ? 'jungle' : 'secondary'} className="h-16 px-12 text-xl rounded-full shadow-lg" onClick={handleNext}>
                {selectedOption?.isCorrect ? 'Great! Next Question' : 'Try the next one'} <Play className="ml-2 h-6 w-6 fill-current" />
              </Button>
            </div>
          )}
        </div>
      )}

      {gameState === 'completed' && (
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in duration-500 shadow-2xl border-4 border-jungle-yellow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-jungle-yellow/20 rounded-full blur-2xl" />
          
          <div className="w-24 h-24 bg-jungle-yellow text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-jungle-yellow/30">
            <Trophy className="h-12 w-12" />
          </div>
          
          <h1 className="text-4xl font-display font-extrabold mb-2 text-foreground">Excellent!</h1>
          <p className="text-xl font-bold text-muted-foreground mb-8">
            You scored {score + (selectedOption?.isCorrect ? 1 : 0)} out of {questions.length}
          </p>
          
          <div className="flex flex-col gap-3">
            <Button size="lg" variant="jungle" className="w-full text-lg shadow-md" onClick={() => setLocation('/student/lessons')}>
              Continue Adventure
            </Button>
            <Button size="lg" variant="ghost" className="w-full font-bold" onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setGameState('intro');
            }}>
              Play Again
            </Button>
          </div>
        </Card>
      )}

    </GameLayout>
  );
}
