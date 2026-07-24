import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, ChevronRight } from 'lucide-react';

const playOceanSound = (style: 'pop' | 'splash' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (style === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.08);
  } else if (style === 'splash') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (style === 'fanfare') {
    const chord = [329.63, 392.00, 523.25, 659.25]; // E, G, C, E
    chord.forEach((pitch, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(pitch, now + (i * 0.06));
      g.gain.setValueAtTime(0.15, now + (i * 0.06));
      g.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.06) + 0.4);
      o.connect(g); g.connect(ctx.destination);
      o.start(now + (i * 0.06)); o.stop(now + (i * 0.06) + 0.4);
    });
  }
};

const numberWords = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
const countEmojis = ['⭐', '🐚', '🐠', '🦀', '🪙', '💎'];
const rewardGems = ['💎', '👑', '🔮', '🔱', '💰', '⚔️', '🧱', '🏺'];

interface DeepDiveProps {
  onComplete?: () => void;
}

export function DeepDive({ onComplete }: DeepDiveProps) {
  const MAX_SCORE = 5;
  
  const [score, setScore] = useState(0);
  const [correctNumber, setCorrectNumber] = useState(1);
  const [useWordClue, setUseWordClue] = useState(false);
  const [activeIcon, setActiveIcon] = useState('🐠');
  const [choices, setChoices] = useState<number[]>([]);
  const [wrongBubbles, setWrongBubbles] = useState<number[]>([]);
  const [poppedBubble, setPoppedBubble] = useState<number | null>(null);
  
  const [chestUnlocked, setChestUnlocked] = useState(false);
  const [wonGem, setWonGem] = useState('');
  const [gemsBox, setGemsBox] = useState<string[]>([]);

  const generateLevel = () => {
    const target = Math.floor(Math.random() * 9) + 1; // 1 to 9
    setCorrectNumber(target);
    setUseWordClue(Math.random() > 0.5);
    setActiveIcon(countEmojis[Math.floor(Math.random() * countEmojis.length)]);

    const newChoices = [target];
    while (newChoices.length < 3) {
      const fake = Math.floor(Math.random() * 9) + 1;
      if (!newChoices.includes(fake)) newChoices.push(fake);
    }
    setChoices(newChoices.sort(() => Math.random() - 0.5));
    setWrongBubbles([]);
    setPoppedBubble(null);
  };

  const resetGame = () => {
    setScore(0);
    setChestUnlocked(false);
    generateLevel();
  };

  useEffect(() => {
    generateLevel();
  }, []);

  const handlePop = (val: number) => {
    if (wrongBubbles.includes(val) || poppedBubble !== null || chestUnlocked) return;

    if (val === correctNumber) {
      playOceanSound('pop');
      setPoppedBubble(val);
      
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          playOceanSound('fanfare');
          const gem = rewardGems[Math.floor(Math.random() * rewardGems.length)];
          setWonGem(gem);
          setGemsBox(prev => [...prev, gem]);
          setChestUnlocked(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 800);
      } else {
        setTimeout(() => generateLevel(), 1000);
      }
    } else {
      playOceanSound('splash');
      setWrongBubbles(prev => [...prev, val]);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-b from-[#0ea5e9] to-[#0c4a6e] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-[#0284c7] relative overflow-hidden text-white font-display">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-white font-bold bg-white/20 hover:bg-white/40" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-md mt-auto mb-auto bg-[#0c4a6e]/60 border-4 border-[#0284c7] rounded-3xl p-6 shadow-2xl backdrop-blur-sm relative">
        
        {/* HUD */}
        <div className="flex justify-between text-xl font-bold text-[#38bdf8] drop-shadow-md mb-4">
          <div>Score: <span className="text-[#fef08a]">{score}</span></div>
          <div>Goal: <span className="text-[#fb7185]">{MAX_SCORE}</span></div>
        </div>

        {/* Clue Window */}
        <div className="bg-white/95 text-[#0c4a6e] rounded-3xl p-4 my-4 shadow-lg flex flex-col items-center text-center">
          <motion.div 
            animate={{ y: [-4, 4, -4], rotate: [0, 3, -3, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="text-6xl mb-2"
          >
            🤿
          </motion.div>
          <div className="text-2xl font-bold text-[#0369a1] mb-2">
            {useWordClue ? 'Find the number...' : 'Count and match!'}
          </div>
          
          <div className="min-h-[48px] flex items-center justify-center">
            {useWordClue ? (
              <span className="text-[#e11d48] text-4xl font-extrabold tracking-widest uppercase">
                {numberWords[correctNumber]}
              </span>
            ) : (
              <div className="flex flex-wrap justify-center gap-1">
                {Array.from({ length: correctNumber }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-4xl"
                  >
                    {activeIcon}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[#e0f2fe] font-bold mt-2 mb-6">Tap the floating bubble to pop it!</p>

        {/* Bubble Zone */}
        <div className="flex justify-around items-center h-48 my-6">
          {choices.map((val, idx) => {
            const isWrong = wrongBubbles.includes(val);
            const isPopped = poppedBubble === val;
            
            return (
              <motion.div
                key={`${val}-${idx}-${score}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: isPopped ? -20 : [-5, 5, -5],
                  scale: isPopped ? 1.5 : isWrong ? 0.9 : 1,
                  opacity: isPopped ? 0 : isWrong ? 0.3 : 1
                }}
                transition={{
                  y: isPopped ? { duration: 0.3 } : { repeat: Infinity, duration: 2.5 + idx * 0.5, ease: "easeInOut" },
                  opacity: { duration: 0.3 }
                }}
                onClick={() => handlePop(val)}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl font-black text-white cursor-pointer shadow-lg drop-shadow-md border-[3px] border-white/60 select-none ${
                  isWrong ? 'pointer-events-none cursor-default' : ''
                }`}
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(56, 189, 248, 0.5) 50%, rgba(2, 132, 199, 0.9) 100%)'
                }}
              >
                {val}
              </motion.div>
            );
          })}
        </div>

        {/* Trophy Deck */}
        <div className="bg-black/25 rounded-2xl p-3 mt-4 border-b-4 border-[#0369a1]">
          <div className="text-sm text-[#38bdf8] font-bold uppercase mb-2 text-center">Sunken Treasure Collection</div>
          <div className="flex justify-center gap-3 text-3xl min-h-[40px]">
            <AnimatePresence>
              {gemsBox.map((gem, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="drop-shadow-md"
                >
                  {gem}
                </motion.span>
              ))}
            </AnimatePresence>
            {gemsBox.length === 0 && <span className="opacity-0">💎</span>}
          </div>
        </div>

        {/* Chest Overlay */}
        <AnimatePresence>
          {chestUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[radial-gradient(circle,#0284c7_0%,#0c4a6e_100%)] rounded-3xl flex flex-col justify-center items-center z-50 p-6 text-center border-4 border-[#38bdf8]"
            >
              <h2 className="text-[#fef08a] text-4xl font-extrabold mb-2 drop-shadow-md">🏴‍☠️ Treasure Found! 🏴‍☠️</h2>
              <p className="text-[#e0f2fe] text-xl font-bold mb-6">Your submarine opened a legendary chest!</p>
              
              <motion.div 
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-8xl drop-shadow-[0_0_25px_#fef08a] mb-8"
              >
                {wonGem}
              </motion.div>
              
              <Button size="lg" onClick={resetGame} className="bg-[#fb7185] hover:bg-[#e11d48] text-white text-2xl font-bold h-16 px-8 rounded-full shadow-[0_6px_0_#be123c] hover:shadow-[0_2px_0_#be123c] hover:translate-y-1 transition-all">
                Play Again! 🔄
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}