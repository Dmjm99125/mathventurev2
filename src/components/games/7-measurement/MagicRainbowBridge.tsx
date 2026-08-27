import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  clampRainbowBridgeTargetX,
  getRainbowBridgeTargetX,
} from './magicRainbowBridgeLayout';

const playSound = (type: 'build' | 'success' | 'fail' | 'bounce' | 'crash' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'build') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(800, now + 2);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 2);
  } else if (type === 'success') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'fail') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'bounce') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'crash') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }
};

interface MagicRainbowBridgeProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function MagicRainbowBridge({ onComplete, allowSkip = true }: MagicRainbowBridgeProps) {
  const MAX_SCORE = 10;
  const BRIDGE_START_X = 70;

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [message, setMessage] = useState('Press and HOLD to build!');
  const [msgColor, setMsgColor] = useState('#1565c0');
  const [gameState, setGameState] = useState<'idle' | 'building' | 'animating'>('idle');
  const [targetX, setTargetX] = useState(250);
  const [boardWidth, setBoardWidth] = useState(320);
  const [rainbowWidth, setRainbowWidth] = useState(0);
  const [unicornPos, setUnicornPos] = useState({ x: 0, y: 0, r: 0 });
  const [castlePos, setCastlePos] = useState({ x: 0, y: 0, r: 0 });
  const [showMushroom, setShowMushroom] = useState(false);
  const [mushroomX, setMushroomX] = useState(0);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const isBuildingRef = useRef(false);

  const startRound = () => {
    setRainbowWidth(0);
    setUnicornPos({ x: 0, y: 0, r: 0 });
    setCastlePos({ x: 0, y: 0, r: 0 });
    setShowMushroom(false);
    setTargetX(getRainbowBridgeTargetX(boardWidth));
    setMessage('Press and HOLD to build the bridge!');
    setMsgColor('#1565c0');
    setGameState('idle');
  };

  useEffect(() => {
    const node = boardRef.current;
    if (!node) {
      return;
    }

    const updateBoardWidth = () => {
      setBoardWidth(node.clientWidth);
    };

    updateBoardWidth();

    const observer = new ResizeObserver(updateBoardWidth);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    startRound();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setTargetX((currentTargetX) => clampRainbowBridgeTargetX(currentTargetX, boardWidth));
  }, [boardWidth]);

  const buildLoop = () => {
    if (!isBuildingRef.current) {
      return;
    }

    setRainbowWidth((prev) => {
      const nextWidth = prev + 3;
      if (nextWidth > 350) {
        stopBuilding();
        return prev;
      }
      return nextWidth;
    });

    requestRef.current = requestAnimationFrame(buildLoop);
  };

  const startBuilding = (e: React.PointerEvent) => {
    if (gameState !== 'idle') {
      return;
    }

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    setGameState('building');
    isBuildingRef.current = true;
    setMessage('Building... let go when it reaches!');
    playSound('build');
    requestRef.current = requestAnimationFrame(buildLoop);
  };

  const stopBuilding = () => {
    if (!isBuildingRef.current) {
      return;
    }

    isBuildingRef.current = false;
    const newAttempts = attempts + 1;
    setAttempts(prev => prev + 1);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    setGameState('animating');
    setTimeout(testMeasurement, 50);
  };

  const testMeasurement = () => {
    const newAttempts = attempts;
    setRainbowWidth((finalWidth) => {
      const gapStart = targetX - BRIDGE_START_X;
      const gapEnd = gapStart + 60;

      if (finalWidth < gapStart) {
        setMessage("Oh no! It's too short!");
        setMsgColor('#c62828');
        playSound('fail');
        setUnicornPos({ x: finalWidth, y: 0, r: 0 });

        setTimeout(() => {
          setMushroomX(BRIDGE_START_X + finalWidth - 15);
          setShowMushroom(true);
          setUnicornPos({ x: finalWidth + 10, y: 150, r: 45 });

          setTimeout(() => {
            playSound('bounce');
            setUnicornPos({ x: finalWidth + 30, y: 80, r: 90 });
            setTimeout(startRound, 1500);
          }, 300);
        }, 1000);
      } else if (finalWidth > gapEnd) {
        setMessage('Whoops! Too long! You bumped the castle!');
        setMsgColor('#e65100');
        playSound('crash');
        setCastlePos({ x: 40, y: -10, r: 15 });
        setUnicornPos({ x: gapEnd - 10, y: 0, r: 0 });
        setTimeout(startRound, 2500);
      } else {
        setMessage('⭐ PERFECT MEASUREMENT! ⭐');
        setMsgColor('#2e7d32');
        playSound('success');
        setUnicornPos({ x: gapStart + 20, y: 0, r: 0 });

        setTimeout(() => {
          setCastlePos({ x: 0, y: -10, r: 0 });

          setTimeout(() => {
            const newScore = score + 1;
            setScore(newScore);
            if (newScore >= MAX_SCORE) {
              setIsCompleted(true);
              if (allowSkip !== false) onComplete?.(newScore, newAttempts);
              playSound('fanfare');
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            } else {
              startRound();
            }
          }, 1000);
        }, 1500);
      }

      return finalWidth;
    });
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setIsCompleted(false);
    startRound();
  };

  return (
    <div className="relative flex min-h-[600px] w-full max-w-4xl flex-col items-center rounded-[3rem] border-4 border-white bg-[#e0f2f1] p-4 font-display shadow-sm select-none touch-none md:p-6">
      <div className="z-10 mb-4 flex w-full justify-center md:justify-end">
        {onComplete && allowSkip !== false && (
          <Button
            variant="ghost"
            className="w-full max-w-sm justify-center bg-white/50 font-bold text-[#00796b] hover:bg-white md:w-auto"
            onClick={() => onComplete?.()}
          >
            Skip <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="my-auto flex w-full max-w-lg flex-col items-center">
        <h1 className="mb-2 text-center text-2xl font-extrabold leading-tight text-[#6a1b9a] drop-shadow-sm md:text-4xl">
          🦄 Magic Rainbow Bridge! 🦄
        </h1>

        <div className="mb-2 flex w-full justify-center px-2 text-lg font-bold text-[#fbc02d] md:px-4 md:text-xl">
          <div className="flex flex-wrap items-center justify-center gap-1 text-center">
            <Star className="h-5 w-5 fill-current md:h-6 md:w-6" />
            Score: <span className="text-[#f57f17]">{score}</span> / {MAX_SCORE}
          </div>
        </div>

        <div
          className="mb-4 w-full max-w-md rounded-[2rem] border-4 border-[#4fc3f7] bg-white px-4 py-2 text-center text-lg font-bold leading-snug shadow-sm md:px-6 md:py-3 md:text-xl"
          style={{ color: msgColor }}
        >
          {message}
        </div>

        <div
          ref={boardRef}
          className="relative mb-6 h-[240px] w-full overflow-hidden rounded-[30px] border-4 border-[#4fc3f7] bg-gradient-to-b from-[#81d4fa] to-[#b3e5fc] shadow-[0_8px_20px_rgba(0,0,0,0.15)] md:h-[300px]"
        >
          <div className="absolute bottom-[14px] left-[8px] text-[3rem] leading-none z-10 md:bottom-[20px] md:left-[10px] md:text-[4rem]">
            ☁️
          </div>

          <motion.div
            className="absolute bottom-[32px] left-[18px] text-[2.5rem] leading-none z-30 md:bottom-[40px] md:left-[25px] md:text-[3.5rem]"
            animate={{
              x: unicornPos.x,
              y: unicornPos.y,
              rotate: unicornPos.r,
            }}
            transition={{ duration: gameState === 'animating' ? (unicornPos.y > 0 ? 0.3 : 1) : 0, ease: 'linear' }}
          >
            🦄
          </motion.div>

          <div
            className="absolute bottom-[36px] left-[62px] h-[12px] rounded-full z-20 md:bottom-[45px] md:left-[70px] md:h-[15px]"
            style={{
              width: `${rainbowWidth}px`,
              background: 'linear-gradient(to bottom, #ff5252 20%, #ffeb3b 40%, #4caf50 60%, #2196f3 80%)',
            }}
          />

          <motion.div
            className="absolute bottom-[14px] flex flex-col items-center z-10 md:bottom-[20px]"
            style={{ left: `${targetX}px` }}
            animate={{
              x: castlePos.x,
              y: castlePos.y,
              rotate: castlePos.r,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          >
            <div className="z-20 -mb-[12px] text-[2.25rem] leading-none md:-mb-[15px] md:text-[3rem]">🏰</div>
            <div className="z-10 text-[3rem] leading-none md:text-[4rem]">☁️</div>
          </motion.div>

          <AnimatePresence>
            {showMushroom && (
              <motion.div
                className="absolute bottom-[-5px] text-[2.5rem] leading-none z-20 md:text-[3rem]"
                style={{ left: `${mushroomX}px` }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5, ease: 'easeInOut' }}
              >
                🍄
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="w-full max-w-sm cursor-pointer rounded-full border-none bg-[#ff4081] px-6 py-4 text-xl font-bold text-white shadow-[0_6px_0_#c2185b] outline-none active:translate-y-[6px] active:shadow-none disabled:cursor-default disabled:opacity-50 disabled:active:translate-y-0 disabled:active:shadow-[0_6px_0_#c2185b] touch-none select-none md:px-10 md:py-5 md:text-2xl"
          onPointerDown={startBuilding}
          onPointerUp={stopBuilding}
          onPointerCancel={stopBuilding}
          onPointerLeave={stopBuilding}
          disabled={gameState === 'animating' || isCompleted}
        >
          HOLD TO BUILD!
        </button>
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center rounded-[3rem] bg-[#e0f2f1]/95 p-6 text-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="mb-4 text-[6rem] leading-none drop-shadow-lg md:text-[8rem]"
            >
              🦄✨
            </motion.div>
            <h1 className="mb-4 text-3xl font-extrabold text-[#6a1b9a] drop-shadow-sm md:text-6xl">
              RAINBOW MASTER!
            </h1>
            <p className="mb-8 text-xl font-bold text-[#00695c] md:text-2xl">You crossed 10 bridges!</p>

            <div className="flex gap-4">
              {allowSkip === false && onComplete && (
                <Button size="lg" variant="jungle" onClick={() => onComplete?.(score, attempts)} className="text-xl px-8 h-16 rounded-full shadow-lg">
                  Next Game <ChevronRight className="ml-2 h-6 w-6" />
                </Button>
              )}
              <Button
                size="lg"
                onClick={resetGame}
                className="h-16 rounded-full bg-[#ff4081] px-8 text-xl font-bold text-white shadow-[0_6px_0_#c2185b] transition-all hover:translate-y-1 hover:bg-[#c2185b] hover:shadow-[0_2px_0_#c2185b] md:px-10 md:text-2xl"
              >
                Play Again! 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
