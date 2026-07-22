import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useSearch, useLocation } from 'wouter';
import { allTopics } from '@/data';
import { freePlayTopics } from '@/data/freePlay';
import { lessonContent } from '@/data/lessonContent';
import { GameLayout } from '@/components/GameLayout';
import { LessonSlideCard } from '@/components/LessonSlideCard';
import { ColorMatchingGame } from '@/components/games/1-colors/ColorMatchingGame';
import { BalloonFindingGame } from '@/components/games/1-colors/BalloonFindingGame';
import { RainbowColorCatcher } from '@/components/games/1-colors/RainbowColorCatcher';
import { RainbowColorDeluxe } from '@/components/games/1-colors/RainbowColorDeluxe';
import { RainbowGalaxyExplorer } from '@/components/games/1-colors/RainbowGalaxyExplorer';
import { ChooseWhichColor } from '@/components/games/1-colors/ChooseWhichColor';
import { ShapeMatchingGame } from '@/components/games/2-shapes/ShapeMatchingGame';
import { FindTheShape } from '@/components/games/2-shapes/FindTheShape';
import { MonsterCafe } from '@/components/games/2-shapes/MonsterCafe';
import { ShapeMatcher } from '@/components/games/2-shapes/ShapeMatcher';
import { ShapeHunter } from '@/components/games/2-shapes/ShapeHunter';
import { ShapeRacing } from '@/components/games/2-shapes/ShapeRacing';
import { ShapeWizard } from '@/components/games/2-shapes/ShapeWizard';
import { HungryDragon } from '@/components/games/2-shapes/HungryDragon';
import { ArrangeNumbers } from '@/components/games/3-sequencing/ArrangeNumbers';
import { ArrangeLetters } from '@/components/games/3-sequencing/ArrangeLetters';
import { SizeSorter } from '@/components/games/3-sequencing/SizeSorter';
import { ShortestLongest } from '@/components/games/3-sequencing/ShortestLongest';
import { SmallestLargestCake } from '@/components/games/3-sequencing/SmallestLargestCake';
import { SurpriseSequencing } from '@/components/games/3-sequencing/SurpriseSequencing';
import { AnimalVehicleBuilder } from '@/components/games/3-sequencing/AnimalVehicleBuilder';
import { PatternTrainAcademy } from '@/components/games/3-sequencing/PatternTrainAcademy';
import { SandwichMaker } from '@/components/games/3-sequencing/SandwichMaker';
import { AdditionFunGame } from '@/components/games/4-addition/AdditionFunGame';
import { AppleAddition } from '@/components/games/4-addition/AppleAddition';
import { FruitPopMath } from '@/components/games/4-addition/FruitPopMath';
import { AdditionAdventure } from '@/components/games/4-addition/AdditionAdventure';
import { SecondAdditionRound } from '@/components/games/4-addition/SecondAdditionRound';
import { AnimalSafari } from '@/components/games/4-addition/AnimalSafari';
import { UnderTheSea } from '@/components/games/4-addition/UnderTheSea';
import { Carnival } from '@/components/games/4-addition/Carnival';
import { IceCreamShop } from '@/components/games/4-addition/IceCreamShop';
import { Pizza } from '@/components/games/4-addition/Pizza';
import { ComicStarCatcher } from '@/components/games/4-addition/ComicStarCatcher';
import { DrawingCanvas } from '@/components/shared/DrawingCanvas';
import { Card, Button } from '@/components/ui';
import { CheckCircle2, XCircle, Trophy, Play, ChevronRight, ChevronLeft, SkipForward, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSubmitAttempt } from '@/lib/hooks';

type GameState = 'video' | 'lesson' | 'quiz-intro' | 'playing' | 'feedback' | 'completed';

export function QuizPage() {
  const [, params] = useRoute('/student/lessons/:topic');
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const topic = params?.topic || 'colors';
  const [, setLocation] = useLocation();
  const submitAttempt = useSubmitAttempt();

  const rawQuestions = assignmentId
    ? (allTopics[topic as keyof typeof allTopics] || [])
    : (freePlayTopics[topic as keyof typeof freePlayTopics] || []);

  const questions = topic === 'sequencing' ? rawQuestions.slice(0, 10) : rawQuestions;

  const lesson = lessonContent[topic];

  // ── Stage state ────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>('video');
  const [slideIndex, setSlideIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<{ image: string; isCorrect: boolean } | null>(null);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const question = questions[currentIndex];
  const slides = lesson?.slides ?? [];

  // ── Stage helpers ──────────────────────────────────────────────────────────
  const currentStage = (): 'video' | 'lesson' | 'quiz' => {
    if (gameState === 'video') return 'video';
    if (gameState === 'lesson') return 'lesson';
    return 'quiz';
  };

  const goToLesson = () => {
    setSlideIndex(0);
    setGameState('lesson');
  };

  const goToQuiz = () => {
    setGameState('quiz-intro');
  };

  // ── Quiz handlers ──────────────────────────────────────────────────────────
  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleSelect = (option: { image: string; isCorrect: boolean }) => {
    if (gameState !== 'playing') return;
    setSelectedOption(option);
    setGameState('feedback');
    if (option.isCorrect) setScore(s => s + 1);
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setGameState('playing');
    } else {
      setGameState('completed');
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const maxScore = questions.length;
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#eab308', '#f97316'] });
      try {
        await submitAttempt.mutateAsync({
          lessonId: topic,
          assignmentId,
          score: score + (selectedOption?.isCorrect ? 1 : 0),
          maxScore,
          durationSeconds,
        });
      } catch (e) {
        console.error('Failed to submit score', e);
      }
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: no lesson content for this topic
  // ─────────────────────────────────────────────────────────────────────────
  if (!questions.length && !lesson) {
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

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: VIDEO STAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (gameState === 'video') {
    return (
      <GameLayout topic={topic} stage="video">
        <div className="w-full max-w-3xl flex flex-col items-center gap-6 animate-in fade-in duration-500">
          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-foreground capitalize">{topic}</h1>
            <p className="text-sm font-bold text-muted-foreground">Watch the video first!</p>
          </div>

          {/* Video player */}
          {lesson?.videoSrc ? (
            <Card className="w-full overflow-hidden border-4 border-primary/30 shadow-2xl rounded-2xl">
              <video
                ref={videoRef}
                src={lesson.videoSrc as string}
                controls
                className="w-full rounded-xl"
                style={{ maxHeight: '380px' }}
                onError={() => {/* graceful — controls still show */}}
              />
            </Card>
          ) : (
            <Card className="w-full p-12 text-center border-4 border-dashed border-primary/20">
              <p className="text-muted-foreground font-bold">Video not available</p>
            </Card>
          )}

          {/* Citation */}
          {lesson && (
            <p className="text-xs text-muted-foreground font-bold text-center max-w-lg italic">
              "{lesson.videoTitle}" — {lesson.videoCredit}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 w-full justify-center">
            <Button
              variant="ghost"
              size="lg"
              className="gap-2 text-muted-foreground font-bold"
              onClick={goToLesson}
            >
              <SkipForward className="h-4 w-4" /> Skip Video
            </Button>
            <Button
              size="lg"
              variant="jungle"
              className="gap-2 text-lg h-14 px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              onClick={goToLesson}
            >
              Next: Lesson <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </GameLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: LESSON STAGE
  // ─────────────────────────────────────────────────────────────────────────
  if (gameState === 'lesson') {
    const slide = slides[slideIndex];
    const isLast = slideIndex === slides.length - 1;

    return (
      <GameLayout topic={topic} stage="lesson">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          {slide ? (
            <LessonSlideCard slide={slide} index={slideIndex + 1} total={slides.length} />
          ) : (
            <Card className="p-8 text-center">
              <p className="font-bold text-muted-foreground">No lesson slides for this topic yet.</p>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-3 items-center">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 font-bold"
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex(i => i - 1)}
            >
              <ChevronLeft className="h-5 w-5" /> Back
            </Button>

            {/* Dot pagination */}
            <div className="flex gap-1.5 mx-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${i === slideIndex ? 'bg-primary w-5' : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'}`}
                />
              ))}
            </div>

            {isLast || !slides.length ? (
              <Button
                variant="jungle"
                size="lg"
                className="gap-2 font-bold h-12 px-6 rounded-full shadow-lg hover:scale-105 transition-transform"
                onClick={goToQuiz}
              >
                Start Activities <ChevronRight className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="gap-2 font-bold"
                onClick={() => setSlideIndex(i => i + 1)}
              >
                Next <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </GameLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: QUIZ STAGES (intro / playing / feedback / completed)
  // ─────────────────────────────────────────────────────────────────────────
  if (!questions.length) {
    return (
      <GameLayout topic={topic} stage="quiz">
        <Card className="p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Under Construction</h2>
          <p className="text-muted-foreground mb-8">This chapter's questions are being built!</p>
          <Button onClick={() => setLocation('/student/lessons')}>Go Back</Button>
        </Card>
      </GameLayout>
    );
  }

  return (
    <GameLayout topic={topic} stage="quiz">

      {gameState === 'quiz-intro' && (
        <Card className="max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500 shadow-2xl border-4 border-primary">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4 capitalize">{topic}</h1>
          <p className="text-lg text-muted-foreground font-bold mb-8">
            Time for the activities! Let's see what you learned.
          </p>
          <Button size="lg" variant="jungle" className="w-full text-xl h-16 rounded-full shadow-lg" onClick={startGame}>
            Start <Play className="ml-2 h-6 w-6 fill-current" />
          </Button>
        </Card>
      )}

      {(gameState === 'playing' || gameState === 'feedback') && question && (
        topic === 'colors' && currentIndex === 0 ? (
          <ColorMatchingGame onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'colors' && currentIndex === 1 ? (
          <BalloonFindingGame onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'colors' && currentIndex === 2 ? (
          <RainbowColorCatcher onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'colors' && currentIndex === 3 ? (
          <RainbowColorDeluxe onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'colors' && currentIndex === 4 ? (
          <RainbowGalaxyExplorer onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'colors' && currentIndex === 5 ? (
          <ChooseWhichColor onComplete={() => {
            // Give some points for completing the whole thing
            setScore(s => s + 10);
            setLocation('/');
          }} />
        ) : topic === 'shapes' && currentIndex === 0 ? (
          <ShapeMatchingGame onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 1 ? (
          <FindTheShape onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 2 ? (
          <MonsterCafe onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 3 ? (
          <ShapeMatcher onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 4 ? (
          <ShapeHunter onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 5 ? (
          <ShapeRacing onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 6 ? (
          <ShapeWizard onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 7 ? (
          <HungryDragon onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'shapes' && currentIndex === 8 ? (
          <DrawingCanvas onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 0 ? (
          <ArrangeNumbers onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 1 ? (
          <ArrangeLetters onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 2 ? (
          <SizeSorter onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 3 ? (
          <ShortestLongest onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 4 ? (
          <SmallestLargestCake onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 5 ? (
          <SurpriseSequencing onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 6 ? (
          <AnimalVehicleBuilder onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 7 ? (
          <PatternTrainAcademy onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 8 ? (
          <SandwichMaker onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'sequencing' && currentIndex === 9 ? (
          <DrawingCanvas 
            title="Sequencing Canvas"
            icon={Pencil}
            onComplete={() => {
              setScore(s => s + 1);
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }} 
          />
        ) : topic === 'addition' && currentIndex === 0 ? (
          <AdditionFunGame onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 1 ? (
          <AppleAddition onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 2 ? (
          <FruitPopMath onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 3 ? (
          <AdditionAdventure onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 4 ? (
          <SecondAdditionRound onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 5 ? (
          <AnimalSafari onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 6 ? (
          <UnderTheSea onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 7 ? (
          <Carnival onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 8 ? (
          <IceCreamShop onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 9 ? (
          <Pizza onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 10 ? (
          <ComicStarCatcher onComplete={() => {
            setScore(s => s + 1);
            if (currentIndex < questions.length - 1) {
              setCurrentIndex(c => c + 1);
              setSelectedOption(null);
              setGameState('playing');
            } else {
              setSelectedOption({ image: '', isCorrect: true });
              setTimeout(handleNext, 0);
            }
          }} />
        ) : topic === 'addition' && currentIndex === 11 ? (
          <DrawingCanvas onComplete={handleNext} />
        ) : (
        <div className="w-full max-w-5xl flex flex-col items-center">
          {/* Question Prompt */}
          <div className="mb-12 text-center flex flex-col items-center gap-4">
            <h2
              className="text-3xl md:text-5xl font-display font-extrabold text-foreground"
              dangerouslySetInnerHTML={{ __html: question.prompt || 'Choose the correct answer' }}
            />
          </div>

          {/* Options Grid */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {question.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              let stateClass = 'border-border hover:-translate-y-2 hover:border-primary cursor-pointer';

              if (gameState === 'feedback') {
                if (isSelected) {
                  stateClass = opt.isCorrect
                    ? 'border-primary bg-primary/10 scale-110 cursor-default'
                    : 'border-destructive bg-destructive/10 cursor-default';
                } else {
                  stateClass = 'opacity-50 grayscale cursor-default';
                }
              }

              return (
                <Card
                  key={i}
                  className={`p-6 border-4 transition-all duration-300 flex items-center justify-center relative ${stateClass}`}
                  onClick={() => handleSelect(opt)}
                >
                  <img
                    src={`/assets/images/${opt.image}`}
                    alt="option"
                    className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md"
                  />
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

          {/* Next button */}
          {gameState === 'feedback' && (
            <div className="mt-12 animate-in fade-in slide-in-from-bottom-4">
              <Button
                size="lg"
                variant={selectedOption?.isCorrect ? 'jungle' : 'secondary'}
                className="h-16 px-12 text-xl rounded-full shadow-lg"
                onClick={handleNext}
              >
                {selectedOption?.isCorrect ? 'Great! Next Question' : 'Try the next one'}{' '}
                <Play className="ml-2 h-6 w-6 fill-current" />
              </Button>
            </div>
          )}
        </div>
        )
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
            <Button size="lg" variant="jungle" className="w-full text-lg shadow-md" onClick={() => setLocation('/')}>
              Return to Main Menu
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full font-bold"
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setSelectedOption(null);
                setGameState('video');
                setSlideIndex(0);
              }}
            >
              Play Again
            </Button>
          </div>
        </Card>
      )}

    </GameLayout>
  );
}
