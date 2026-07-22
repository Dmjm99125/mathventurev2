import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { Play, ChevronRight } from 'lucide-react';

const playMonsterSound = (style: 'chomp' | 'error' | 'fanfare') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (style === 'chomp') {
    [0, 0.12].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now + delay);
      osc.frequency.linearRampToValueAtTime(40, now + delay + 0.08);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + delay); osc.stop(now + delay + 0.08);
    });
  } else if (style === 'error') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (style === 'fanfare') {
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.07));
      gain.gain.setValueAtTime(0.2, now + (idx * 0.07));
      gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.07) + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + (idx * 0.07)); osc.stop(now + (idx * 0.07) + 0.2);
    });
  }
};

const monsterEmojis = ['👾', '👹', '🤖', '👽', '🦊', '🦁'];
const monsterColors = ['#a855f7', '#22c55e', '#f97316', '#ec4899', '#06b6d4'];
const snackPool = ['🍔', '🍕', '🍩', '🍪', '🍓', '🍉', '🥕', '🍦'];
const badgePool = ['🏅', '🥇', '⭐', '💎', '👑', '🔮', '🚀', '🎁'];

interface NumberMonsterProps {
  onComplete?: () => void;
}

export function NumberMonster({ onComplete }: NumberMonsterProps) {
  const MAX_SCORE = 5;
  
  const [score, setScore] = useState(0);
  const [targetNumber, setTargetNumber] = useState(2);
  const [activeSnack, setActiveSnack] = useState('🍔');
  const [counts, setCounts] = useState<number[]>([]);
  const [wrongChoices, setWrongChoices] = useState<number[]>([]);
  const [isCorrectlyGuessed, setIsCorrectlyGuessed] = useState(false);
  const [monsterKey, setMonsterKey] = useState(0); // For chewing animation
  const [borderColor, setBorderColor] = useState(monsterColors[0]);
  
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const [wonBadge, setWonBadge] = useState('');
  const [shelfBadges, setShelfBadges] = useState<string[]>([]);

  const generateLevel = () => {
    const target = Math.floor(Math.random() * 8) + 2; // 2 to 9
    setTargetNumber(target);
    setActiveSnack(snackPool[Math.floor(Math.random() * snackPool.length)]);

    const newCounts = [target];
    while (newCounts.length < 3) {
      const fake = Math.floor(Math.random() * 9) + 1;
      if (!newCounts.includes(fake)) newCounts.push(fake);
    }
    setCounts(newCounts.sort(() => Math.random() - 0.5));
    setWrongChoices([]);
    setIsCorrectlyGuessed(false);
  };

  useEffect(() => {
    generateLevel();
  }, []);

  const handleChoice = (count: number) => {
    if (isCorrectlyGuessed || wrongChoices.includes(count) || badgeUnlocked) return;

    if (count === targetNumber) {
      playMonsterSound('chomp');
      setIsCorrectlyGuessed(true);
      setMonsterKey(prev => prev + 1); // Trigger chew
      
      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          playMonsterSound('fanfare');
          const reward = badgePool[Math.floor(Math.random() * badgePool.length)];
          setWonBadge(reward);
          setShelfBadges(prev => [...prev, reward]);
          setBorderColor(monsterColors[Math.floor(Math.random() * monsterColors.length)]);
          setBadgeUnlocked(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(() => generateLevel(), 1200);
      }
    } else {
      playMonsterSound('error');
      setWrongChoices(prev => [...prev, count]);
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#faf5ff] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative overflow-hidden text-[#334155] font-display">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#6b21a8] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <motion.div 
        animate={{ borderColor }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mt-auto mb-auto bg-white border-[5px] rounded-[32px] p-5 shadow-[0_15px_30px_rgba(168,85,247,0.15)] relative"
      >
        
        {/* Stats */}
        <div className="flex justify-between text-lg font-bold text-[#6b21a8] mb-3">
          <div>Score: <span className="text-[#a855f7]">{score}</span></div>
          <div>Goal: <span className="text-[#f97316]">{MAX_SCORE}</span></div>
        </div>

        {/* Monster Area */}
        <div className="bg-[#f3e8ff] rounded-3xl p-4 mb-5 relative flex flex-col items-center">
          <div className="relative">
            <motion.div 
              key={monsterKey}
              initial={{ scale: 1, rotate: 0 }}
              animate={isCorrectlyGuessed ? { scale: [1, 1.3, 1], rotate: [0, 10, -5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="text-[5.5rem] leading-none inline-block z-10 relative"
            >
              {monsterEmojis[score % monsterEmojis.length]}
            </motion.div>
            
            {/* Target Number Bubble */}
            <div className="absolute top-0 -right-6 bg-white border-4 border-[#cb6ce6] rounded-full w-16 h-16 text-3xl font-black text-[#9333ea] flex justify-center items-center shadow-[0_4px_10px_rgba(0,0,0,0.1)] z-20">
              {targetNumber}
            </div>
          </div>
          <p className="mt-2 mb-0 font-bold text-[#5b21b6]">Feed me exactly {targetNumber} snacks!</p>
        </div>

        {/* Choice Cards */}
        <div className="flex flex-col gap-4">
          {counts.map((count, idx) => {
            const isWrong = wrongChoices.includes(count);
            const isCorrect = isCorrectlyGuessed && count === targetNumber;

            return (
              <motion.div
                key={`${count}-${idx}`}
                whileHover={!isWrong && !isCorrectlyGuessed ? { scale: 1.02 } : {}}
                whileTap={!isWrong && !isCorrectlyGuessed ? { scale: 0.98, y: 4 } : {}}
                onClick={() => handleChoice(count)}
                className={`rounded-2xl p-3 min-h-[60px] flex justify-center items-center flex-wrap gap-2 cursor-pointer transition-colors ${
                  isCorrect 
                    ? 'bg-[#dcfce7] border-4 border-[#22c55e] shadow-[0_4px_0_#16a34a]' 
                    : isWrong 
                      ? 'bg-[#f1f5f9] border-4 border-[#cbd5e1] shadow-[0_4px_0_#94a3b8] opacity-60 pointer-events-none translate-y-1 shadow-[0_0px_0_#94a3b8]'
                      : 'bg-[#f8fafc] border-4 border-[#e2e8f0] shadow-[0_4px_0_#cbd5e1]'
                }`}
              >
                {Array.from({ length: count }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-3xl"
                  >
                    {activeSnack}
                  </motion.span>
                ))}
              </motion.div>
            );
          })}
        </div>

        {/* Badge Shelf */}
        <div className="mt-5 pt-3 border-t-2 border-dashed border-[#e2e8f0]">
          <div className="text-xs text-[#94a3b8] font-bold uppercase mb-2 text-center">Badges Earned</div>
          <div className="flex justify-center gap-2 text-3xl min-h-[40px]">
            <AnimatePresence>
              {shelfBadges.map((badge, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="drop-shadow-sm"
                >
                  {badge}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Reward Overlay */}
        <AnimatePresence>
          {badgeUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 rounded-[26px] flex flex-col justify-center items-center z-50 p-6 text-center"
            >
              <h2 className="text-[#9333ea] text-4xl font-extrabold mb-2">🎉 Number Master! 🎉</h2>
              <p className="text-[#64748b] text-xl font-bold mb-6">You counted beautifully! You won a badge:</p>
              
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                className="text-8xl drop-shadow-xl mb-8"
              >
                {wonBadge}
              </motion.div>
              
              {onComplete && (
                <Button size="lg" onClick={onComplete} className="bg-[#a855f7] hover:bg-[#7e22ce] text-white text-xl font-bold h-14 px-8 rounded-full shadow-[0_5px_0_#7e22ce] hover:shadow-[0_2px_0_#7e22ce] hover:translate-y-1 transition-all">
                  Feed Me More! <Play className="ml-2 w-6 h-6 fill-current" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}