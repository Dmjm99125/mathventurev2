import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation, useSearch } from 'wouter';
import { useLessons, useSubmitAttempt } from '@/lib/hooks';
import { useLanguage } from '@/lib/useLanguage';
import { Button, Card, Badge } from '@/components/ui';
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Star, Volume2, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Game Engine Components ---

function IdentifyGame({ config, onComplete, onAudioPlay }: any) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Resolve labels based on language
  const promptLabel = config.label?.[lang] || config.label?.en || 'Find the item';

  // Resolve option assets based on itemType
  const getAssetPath = (val: string) => {
    if (config.itemType === 'color') return `/assets/colors/${val}.png`;
    if (config.itemType === 'shape') return `/assets/shapes/${val}.png`;
    if (config.itemType === 'number') return `/assets/numbers/${val}.png`;
    return '';
  };

  const handleSelect = (val: string) => {
    if (selected) return; // Prevent multiple clicks
    setSelected(val);
    const correct = val === config.target;
    setIsCorrect(correct);

    // Auto-advance after delay
    setTimeout(() => {
      onComplete(correct ? 1 : 0, 1);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in zoom-in-95 duration-300">
      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-extrabold text-foreground mb-6">
          {promptLabel}
        </h2>
        {config.audioUrl && (
          <Button variant="outline" size="icon" className="h-16 w-16 rounded-full" onClick={() => onAudioPlay(config.audioUrl)}>
            <Volume2 className="h-8 w-8 text-primary" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {config.optionsPool.map((opt: string) => {
          const isSelected = selected === opt;
          const isTarget = opt === config.target;

          let stateClass = "border-border hover:-translate-y-2 hover:border-primary";
          if (selected) {
            if (isTarget) stateClass = isSelected ? "border-primary bg-primary/10 scale-110" : "opacity-50 grayscale";
            else stateClass = isSelected ? "border-destructive bg-destructive/10" : "opacity-50 grayscale";
          }

          return (
            <Card
              key={opt}
              className={`p-6 cursor-pointer border-4 transition-all duration-300 flex items-center justify-center ${stateClass}`}
              onClick={() => handleSelect(opt)}
            >
              <img src={getAssetPath(opt)} alt={opt} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />
              {isSelected && isCorrect && <CheckCircle2 className="absolute top-2 right-2 h-8 w-8 text-primary animate-in zoom-in" />}
              {isSelected && !isCorrect && <XCircle className="absolute top-2 right-2 h-8 w-8 text-destructive animate-in zoom-in" />}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MatchPairsGame({ config, onComplete }: any) {
  const [cards, setCards] = useState<{ id: number, val: string, flipped: boolean, matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);

  useEffect(() => {
    // Init deck
    const deck = [...config.items, ...config.items]
      .sort(() => Math.random() - 0.5)
      .map((val, i) => ({ id: i, val, flipped: false, matched: false }));
    setCards(deck);
  }, [config.items]);

  useEffect(() => {
    if (flippedIds.length === 2) {
      setMoves(m => m + 1);
      const [id1, id2] = flippedIds;
      const c1 = cards.find(c => c.id === id1);
      const c2 = cards.find(c => c.id === id2);

      if (c1?.val === c2?.val) {
        setMatches(m => m + 1);
        setCards(prev => prev.map(c => c.id === id1 || c.id === id2 ? { ...c, matched: true } : c));
        setFlippedIds([]);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => c.id === id1 || c.id === id2 ? { ...c, flipped: false } : c));
          setFlippedIds([]);
        }, 1000);
      }
    }
  }, [flippedIds, cards]);

  useEffect(() => {
    if (cards.length > 0 && matches === config.items.length) {
      setTimeout(() => {
        // Score calculation based on moves (perfect = items.length, lower is better)
        const perfectMoves = config.items.length;
        const maxScore = 100;
        const score = Math.max(10, maxScore - Math.max(0, moves - perfectMoves) * 10);
        onComplete(score, maxScore);
      }, 1000);
    }
  }, [matches, cards.length, config.items.length, moves, onComplete]);

  const handleFlip = (id: number) => {
    if (flippedIds.length >= 2 || flippedIds.includes(id) || cards.find(c => c.id === id)?.matched) return;
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setFlippedIds(prev => [...prev, id]);
  };

  const getAssetPath = (val: string) => `${config.assetFolder}/${val}.png`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in zoom-in-95 duration-300">
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl">
        {cards.map(card => (
          <div
            key={card.id}
            className={`relative w-24 h-24 md:w-32 md:h-32 perspective-1000 cursor-pointer ${card.matched ? 'opacity-50' : ''}`}
            onClick={() => handleFlip(card.id)}
          >
            <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${(card.flipped || card.matched) ? 'rotate-y-180' : ''}`}>
              {/* Back of card */}
              <Card className="absolute inset-0 backface-hidden bg-primary flex items-center justify-center border-4 border-primary-foreground/20">
                <Star className="h-8 w-8 text-white/50" />
              </Card>
              {/* Front of card */}
              <Card className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-4 border-border flex items-center justify-center p-4">
                <img src={getAssetPath(card.val)} alt="card" className="w-full h-full object-contain" />
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SequenceGame({ config, onComplete }: any) {
  const [items, setItems] = useState<{ id: string, val: string, correctIndex: number, currentPos: number | null }[]>([]);
  const [slots, setSlots] = useState<{ val: string | null }[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const shuffled = [...config.items].sort(() => Math.random() - 0.5);
    setItems(shuffled.map((val, i) => ({
      id: Math.random().toString(),
      val,
      correctIndex: config.items.indexOf(val),
      currentPos: null
    })));
    setSlots(config.items.map(() => ({ val: null })));
  }, [config.items]);

  const handleItemClick = (item: any) => {
    if (item.currentPos !== null) return; // already placed

    // Find first empty slot
    const firstEmpty = slots.findIndex(s => s.val === null);
    if (firstEmpty === -1) return;

    // Check if it's the correct item for this slot
    if (item.correctIndex === firstEmpty) {
      // Correct!
      setSlots(prev => {
        const newSlots = [...prev];
        newSlots[firstEmpty] = { val: item.val };
        return newSlots;
      });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, currentPos: firstEmpty } : i));
      setScore(s => s + 1);

      // Check win
      if (firstEmpty === config.items.length - 1) {
        setTimeout(() => {
          onComplete(100, 100);
        }, 1000);
      }
    } else {
      // Wrong! Flash red. Simple mechanic for kids: they can just try again without penalty, or minor penalty.
      const el = document.getElementById(`item-${item.id}`);
      if (el) {
        el.classList.add('animate-[shake_0.5s_ease-in-out]');
        el.classList.add('border-destructive');
        setTimeout(() => {
          el.classList.remove('animate-[shake_0.5s_ease-in-out]');
          el.classList.remove('border-destructive');
        }, 500);
      }
    }
  };

  const getAssetPath = (val: string) => `${config.assetFolder}/${val}.png`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in zoom-in-95 duration-300">
      <h2 className="text-3xl font-display font-bold text-foreground mb-8 text-center">Tap the items in order!</h2>

      {/* Slots */}
      <div className="flex flex-wrap justify-center gap-4 mb-12 bg-black/5 p-6 rounded-3xl w-full max-w-4xl">
        {slots.map((slot, i) => (
          <div key={i} className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl border-4 border-dashed flex items-center justify-center transition-all ${slot.val ? 'border-primary bg-white shadow-sm scale-110' : 'border-border'}`}>
            {slot.val && <img src={getAssetPath(slot.val)} className="w-16 h-16 md:w-20 md:h-20 object-contain animate-in zoom-in" alt="placed" />}
          </div>
        ))}
      </div>

      {/* Available Items */}
      <div className="flex flex-wrap justify-center gap-4">
        {items.map((item) => {
          if (item.currentPos !== null) return <div key={item.id} className="w-20 h-20 md:w-28 md:h-28" />; // Placeholder
          return (
            <Card
              key={item.id}
              id={`item-${item.id}`}
              className="w-20 h-20 md:w-28 md:h-28 p-2 cursor-pointer hover:-translate-y-2 transition-transform border-4 border-border flex items-center justify-center bg-white"
              onClick={() => handleItemClick(item)}
            >
              <img src={getAssetPath(item.val)} className="w-full h-full object-contain" alt="choice" />
            </Card>
          );
        })}
      </div>
    </div>
  );
}


// --- Main Page Component ---

export function LessonGame() {
  const [, params] = useRoute('/student/lessons/:lessonId');
  const searchStr = useSearch();
  const searchParams = new URLSearchParams(searchStr);
  const assignmentId = searchParams.get('assignmentId') || undefined;

  const { data, isLoading } = useLessons();
  const submitAttempt = useSubmitAttempt();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [finalScore, setFinalScore] = useState(0);
  const [finalMaxScore, setFinalMaxScore] = useState(0);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const lesson = data?.lessons.find(l => l.id === params?.lessonId);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.log("Audio play failed", e));
    }
  };

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center font-bold">Loading adventure...</div>;
  if (!lesson) return <div className="p-8 text-center">Lesson not found</div>;

  const startGame = () => {
    setGameState('playing');
    startTimeRef.current = Date.now();
    // Auto-play audio if configured for identify
    if (lesson.game_type === 'identify' && lesson.config.audioUrl) {
      setTimeout(() => playAudio(lesson.config.audioUrl as string), 500);
    }
  };

  const handleComplete = async (score: number, maxScore: number) => {
    setFinalScore(score);
    setFinalMaxScore(maxScore);
    setGameState('completed');

    // Celebrate!
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#eab308', '#f97316']
    });

    try {
      await submitAttempt.mutateAsync({
        lessonId: lesson.id,
        assignmentId,
        score,
        maxScore,
        durationSeconds
      });
    } catch (e) {
      console.error("Failed to submit score", e);
    }
  };

  // Full-screen game layout overlaying the AppLayout container
  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col pt-16">

      {/* Top Game Bar */}
      <div className="h-16 border-b-2 border-border bg-white flex items-center px-4 justify-between shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/student')} className="gap-2 font-bold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Exit
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{lesson.topic}</span>
          <span className="font-display font-bold text-lg leading-none">{lesson.title}</span>
        </div>
        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      <div className="flex-1 overflow-auto bg-[url('/assets/jungle-bg.png')] bg-cover bg-center bg-fixed relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />

        <div className="relative z-10 h-full container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[600px]">

          {gameState === 'intro' && (
            <Card className="max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500 shadow-2xl border-4 border-primary">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <Star className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-display font-bold mb-4">{lesson.title}</h1>
              <p className="text-lg text-muted-foreground font-bold mb-8">{lesson.description}</p>
              <Button size="lg" variant="jungle" className="w-full text-xl h-16 rounded-full shadow-lg" onClick={startGame}>
                Play <Play className="ml-2 h-6 w-6 fill-current" />
              </Button>
            </Card>
          )}

          {gameState === 'playing' && (
            <div className="w-full max-w-5xl">
              {lesson.game_type === 'identify' && <IdentifyGame config={lesson.config} onComplete={handleComplete} onAudioPlay={playAudio} />}
              {lesson.game_type === 'match-pairs' && <MatchPairsGame config={lesson.config} onComplete={handleComplete} />}
              {lesson.game_type === 'sequence' && <SequenceGame config={lesson.config} onComplete={handleComplete} />}
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
                You scored {Math.round((finalScore / finalMaxScore) * 100)}%
              </p>

              <div className="flex flex-col gap-3">
                <Button size="lg" variant="jungle" className="w-full text-lg shadow-md" onClick={() => setLocation('/student/lessons')}>
                  Continue Adventure
                </Button>
                <Button size="lg" variant="ghost" className="w-full font-bold" onClick={() => setGameState('intro')}>
                  Play Again
                </Button>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
