import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight, Star } from 'lucide-react';

const playSound = (type: 'build' | 'success' | 'fail' | 'bounce' | 'crash' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'build') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(800, now + 2); // Pitch goes up over 2 seconds
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 2);
  } else if (type === 'success') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'fail') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'bounce') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'crash') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'fanfare') {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
      gain.gain.setValueAtTime(0.2, now + (idx * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + (idx * 0.1)); osc.stop(now + (idx * 0.1) + 0.4);
    });
  }
};

interface MagicRainbowBridgeProps {
  onComplete?: () => void;
}

export function MagicRainbowBridge({ onComplete }: MagicRainbowBridgeProps) {
  const MAX_SCORE = 10;
  const BRIDGE_START_X = 70;
  
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [message, setMessage] = useState("Press and HOLD to build!");
  const [msgColor, setMsgColor] = useState("#1565c0");
  
  const [gameState, setGameState] = useState<'idle' | 'building' | 'animating'>('idle');
  const [targetX, setTargetX] = useState(250);
  const [rainbowWidth, setRainbowWidth] = useState(0);
  
  // Animation states
  const [unicornPos, setUnicornPos] = useState({ x: 0, y: 0, r: 0 });
  const [castlePos, setCastlePos] = useState({ x: 0, y: 0, r: 0 });
  const [showMushroom, setShowMushroom] = useState(false);
  const [mushroomX, setMushroomX] = useState(0);
  
  const requestRef = useRef<number>();
  const isBuildingRef = useRef(false);

  const startRound = () => {
    setRainbowWidth(0);
    setUnicornPos({ x: 0, y: 0, r: 0 });
    setCastlePos({ x: 0, y: 0, r: 0 });
    setShowMushroom(false);
    setTargetX(Math.floor(Math.random() * 140) + 160);
    setMessage("Press and HOLD to build the bridge!");
    setMsgColor("#1565c0");
    setGameState('idle');
  };

  useEffect(() => {
    startRound();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const buildLoop = () => {
    if (!isBuildingRef.current) return;
    
    setRainbowWidth(prev => {
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
    if (gameState !== 'idle') return;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch(e) {}
    
    setGameState('building');
    isBuildingRef.current = true;
    setMessage("Building... let go when it reaches!");
    playSound('build');
    requestRef.current = requestAnimationFrame(buildLoop);
  };

  const stopBuilding = () => {
    if (!isBuildingRef.current) return;
    isBuildingRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    
    setGameState('animating');
    setTimeout(testMeasurement, 50);
  };

  const testMeasurement = () => {
    setRainbowWidth(finalWidth => {
      const gapStart = targetX - BRIDGE_START_X;
      const gapEnd = gapStart + 60;
      
      if (finalWidth < gapStart) {
        // TOO SHORT
        setMessage("Oh no! It's too short!");
        setMsgColor("#c62828");
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
        // TOO LONG
        setMessage("Whoops! Too long! You bumped the castle!");
        setMsgColor("#e65100");
        playSound('crash');
        
        setCastlePos({ x: 40, y: -10, r: 15 });
        setUnicornPos({ x: gapEnd - 10, y: 0, r: 0 });
        
        setTimeout(startRound, 2500);

      } else {
        // PERFECT
        setMessage("⭐ PERFECT MEASUREMENT! ⭐");
        setMsgColor("#2e7d32");
        playSound('success');
        
        setUnicornPos({ x: gapStart + 20, y: 0, r: 0 });
        
        setTimeout(() => {
          setCastlePos({ x: 0, y: -10, r: 0 });
          
          setTimeout(() => {
            const newScore = score + 1;
            setScore(newScore);
            if (newScore >= MAX_SCORE) {
              setIsCompleted(true);
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
    setIsCompleted(false);
    startRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#e0f2f1] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display select-none touch-none">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#00796b] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-auto mb-auto flex flex-col items-center">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#6a1b9a] mb-2 drop-shadow-sm text-center">🦄 Magic Rainbow Bridge! 🦄</h1>
        
        <div className="w-full flex justify-between px-4 mb-2 text-xl font-bold text-[#fbc02d]">
          <div className="flex items-center gap-1"><Star className="w-6 h-6 fill-current"/> Score: <span className="text-[#f57f17]">{score}</span> / {MAX_SCORE}</div>
        </div>

        <div className="bg-white px-6 py-2 rounded-full border-4 border-[#4fc3f7] text-xl font-bold mb-4 shadow-sm text-center min-w-[280px]" style={{ color: msgColor }}>
          {message}
        </div>

        {/* Game Board */}
        <div className="relative w-full h-[300px] bg-gradient-to-b from-[#81d4fa] to-[#b3e5fc] border-4 border-[#4fc3f7] rounded-[30px] shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden mb-6">
          
          <div className="absolute bottom-[20px] left-[10px] text-[4rem] leading-none z-10">☁️</div>
          
          <motion.div 
            className="absolute bottom-[40px] left-[25px] text-[3.5rem] leading-none z-30"
            animate={{ 
              x: unicornPos.x, 
              y: unicornPos.y, 
              rotate: unicornPos.r 
            }}
            transition={{ duration: gameState === 'animating' ? (unicornPos.y > 0 ? 0.3 : 1) : 0, ease: "linear" }}
          >
            🦄
          </motion.div>

          <div 
            className="absolute bottom-[45px] left-[70px] h-[15px] rounded-full z-20"
            style={{ 
              width: `${rainbowWidth}px`,
              background: 'linear-gradient(to bottom, #ff5252 20%, #ffeb3b 40%, #4caf50 60%, #2196f3 80%)'
            }}
          />

          <motion.div 
            className="absolute bottom-[20px] flex flex-col items-center z-10"
            style={{ left: `${targetX}px` }}
            animate={{ 
              x: castlePos.x, 
              y: castlePos.y, 
              rotate: castlePos.r 
            }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <div className="text-[3rem] leading-none -mb-[15px] z-20">🏰</div>
            <div className="text-[4rem] leading-none z-10">☁️</div>
          </motion.div>

          <AnimatePresence>
            {showMushroom && (
              <motion.div 
                className="absolute bottom-[-5px] text-[3rem] leading-none z-20"
                style={{ left: `${mushroomX}px` }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
              >
                🍄
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Action Button */}
        <button 
          className="bg-[#ff4081] text-white border-none rounded-full px-10 py-5 text-2xl font-bold shadow-[0_6px_0_#c2185b] active:shadow-none active:translate-y-[6px] touch-none select-none outline-none disabled:opacity-50 disabled:active:shadow-[0_6px_0_#c2185b] disabled:active:translate-y-0 cursor-pointer"
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
            className="absolute inset-0 bg-[#e0f2f1]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-[8rem] leading-none mb-4 drop-shadow-lg"
            >
              🦄✨
            </motion.div>
            <h1 className="text-[#6a1b9a] text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-sm">RAINBOW MASTER!</h1>
            <p className="text-2xl text-[#00695c] font-bold mb-8">You crossed 10 bridges!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#ff4081] hover:bg-[#c2185b] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_6px_0_#c2185b] hover:shadow-[0_2px_0_#c2185b] hover:translate-y-1 transition-all">
                Play Again! 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}