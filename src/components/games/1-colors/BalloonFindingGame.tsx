import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLORS = [
  { name: 'RED', hex: '#FF0000' },
  { name: 'BLUE', hex: '#0000FF' },
  { name: 'GREEN', hex: '#228B22' },
  { name: 'YELLOW', hex: '#FFD700' },
  { name: 'PINK', hex: '#FF69B4' },
  { name: 'ORANGE', hex: '#FFA500' },
  { name: 'PURPLE', hex: '#800080' }
];

interface Balloon {
  id: string;
  colorData: { name: string, hex: string };
  left: number;
  duration: number;
  opacity: number;
}

interface BalloonFindingGameProps {
  onComplete?: () => void;
}

export function BalloonFindingGame({ onComplete }: BalloonFindingGameProps) {
  const [score, setScore] = useState(0);
  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [isWin, setIsWin] = useState(false);
  
  const scoreRef = useRef(0);
  const targetColorRef = useRef(COLORS[0]);
  const isWinRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playPop = (isCorrect: boolean) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isCorrect ? 'sine' : 'square';
    osc.frequency.setValueAtTime(isCorrect ? 600 : 150, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
  };

  const createBalloon = useCallback((isCorrect: boolean) => {
    if (isWinRef.current || scoreRef.current >= 10) return;

    const tColor = targetColorRef.current;
    const colorData = isCorrect ? tColor : COLORS[Math.floor(Math.random() * COLORS.length)];
    const newBalloon: Balloon = {
      id: Math.random().toString(36).substring(2, 9),
      colorData,
      left: Math.random() * 80 + 5,
      duration: Math.random() * 3 + 5,
      opacity: 1
    };
    
    setBalloons(prev => [...prev, newBalloon]);
  }, []);

  const initRound = useCallback(() => {
    const newTarget = COLORS[Math.floor(Math.random() * COLORS.length)];
    targetColorRef.current = newTarget;
    setTargetColor(newTarget);
    setBalloons([]);
    setScore(0);
    scoreRef.current = 0;
    setIsWin(false);
    isWinRef.current = false;
    
    for (let i = 0; i < 6; i++) {
      setTimeout(() => createBalloon(i === 0), i * 500);
    }
  }, [createBalloon]);

  useEffect(() => {
    initRound();
    // Cleanup timeouts if component unmounts (simplified)
    return () => {
      isWinRef.current = true;
    };
  }, [initRound]);

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent, balloon: Balloon) => {
    e.preventDefault();
    if (isWinRef.current) return;
    
    if (balloon.colorData.name === targetColorRef.current.name) {
      playPop(true);
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setBalloons(prev => prev.filter(b => b.id !== balloon.id));
      
      if (scoreRef.current >= 10) {
        setIsWin(true);
        isWinRef.current = true;
        setBalloons([]); // clear balloons
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else {
        createBalloon(true);
      }
    } else {
      playPop(false);
      setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, opacity: 0.4 } : b));
    }
  };

  const handleAnimationIteration = (id: string) => {
    if (isWinRef.current) return;
    setBalloons(prev => prev.filter(b => b.id !== id));
    createBalloon(Math.random() > 0.6);
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[600px] flex flex-col relative rounded-3xl overflow-hidden bg-[#e0f4ff] shadow-xl border-4 border-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatUp {
            from { transform: translateY(600px); }
            to { transform: translateY(-200px); }
        }
        .balloon-tail {
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            width: 2px;
            height: 25px;
            background: rgba(0,0,0,0.2);
        }
      `}} />

      {/* Header */}
      <div className="relative w-full h-[120px] bg-white flex flex-col justify-center items-center shadow-[0_4px_10px_rgba(0,0,0,0.1)] z-10 shrink-0">
        <div className="text-2xl md:text-3xl font-display font-bold text-gray-800 mb-1">
          Find the <span style={{ color: targetColor.hex }}>{targetColor.name}</span> balloon!
        </div>
        <div className="text-xl md:text-2xl font-bold text-orange-500">
          Stars: <span>{score}</span> / 10
        </div>
        {onComplete && (
          <Button 
            variant="default" 
            className="absolute top-4 right-4 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-4 py-2 z-20"
            onClick={onComplete}
          >
            Next Game ➡️
          </Button>
        )}
      </div>

      {/* Game Area */}
      <div className="flex-1 relative overflow-hidden w-full touch-none select-none">
        {balloons.map(b => (
          <div
            key={b.id}
            onMouseDown={(e) => handleInteraction(e, b)}
            onTouchStart={(e) => handleInteraction(e, b)}
            onAnimationIteration={() => handleAnimationIteration(b.id)}
            className="absolute rounded-full cursor-pointer flex justify-center items-center shadow-md active:scale-95 transition-transform"
            style={{
              width: '85px',
              height: '105px',
              backgroundColor: b.colorData.hex,
              left: `${b.left}vw`,
              animation: `floatUp ${b.duration}s linear infinite`,
              opacity: b.opacity,
            }}
          >
            <div className="balloon-tail" />
          </div>
        ))}
      </div>

      {/* Win Overlay */}
      {isWin && (
        <div className="absolute inset-0 bg-white/95 z-20 flex flex-col justify-center items-center text-center animate-in zoom-in duration-300">
          <Star className="w-32 h-32 text-yellow-400 fill-current animate-bounce drop-shadow-xl" />
          <h1 className="text-5xl font-display font-extrabold text-orange-500 mt-4">YOU DID IT!</h1>
          <p className="text-2xl font-bold text-gray-700 mt-2 mb-8">You are so smart!</p>
          
          <div className="flex gap-4 flex-col sm:flex-row">
            <Button size="lg" variant="jungle" className="text-xl h-14 px-8 rounded-full" onClick={initRound}>
              Play Again
            </Button>
            {onComplete && (
              <Button size="lg" variant="default" className="text-xl h-14 px-8 rounded-full bg-orange-500 hover:bg-orange-600 shadow-[0_0_0_0_rgba(255,152,0,0.7)] animate-[pulse_1.5s_infinite]" onClick={onComplete}>
                Next Game ➡️
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
