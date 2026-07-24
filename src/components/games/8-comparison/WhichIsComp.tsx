import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare' | 'pop') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'correct') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
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
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  }
};

const items = [
  {emoji: '🐋', name: 'Whale', weight: 100},
  {emoji: '🐠', name: 'Fish', weight: 2},
  {emoji: '🚢', name: 'Ship', weight: 1000},
  {emoji: '⛵', name: 'Small Boat', weight: 50},
  {emoji: '🪨', name: 'Big Rock', weight: 80},
  {emoji: '🐚', name: 'Seashell', weight: 1},
  {emoji: '🐢', name: 'Sea Turtle', weight: 30},
  {emoji: '🦐', name: 'Shrimp', weight: 0.5},
  {emoji: '🦈', name: 'Shark', weight: 90},
  {emoji: '🐡', name: 'Pufferfish', weight: 3},
  {emoji: '⚓', name: 'Anchor', weight: 200},
  {emoji: '🪶', name: 'Feather', weight: 0.1}
];

const rewardsList = ['🐬', '🐙', '🦀', '🐳', '🦑', '🐡', '🐢', '🦈', '🐠', '🦭'];

interface WhichIsCompProps {
  onComplete?: () => void;
}

export function WhichIsComp({ onComplete }: WhichIsCompProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [askingHeavier, setAskingHeavier] = useState(true);
  const [currentOptions, setCurrentOptions] = useState([items[0], items[1]]);
  const [shelfItems, setShelfItems] = useState<string[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [canClick, setCanClick] = useState(true);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const setupRound = () => {
    setAskingHeavier(Math.random() > 0.5);
    
    let index1 = Math.floor(Math.random() * items.length);
    let index2 = Math.floor(Math.random() * items.length);
    while (index1 === index2) {
      index2 = Math.floor(Math.random() * items.length);
    }
    
    // Randomize which is left and right
    if (Math.random() > 0.5) {
      setCurrentOptions([items[index1], items[index2]]);
    } else {
      setCurrentOptions([items[index2], items[index1]]);
    }
    
    setFeedback('none');
    setSelectedIndex(null);
    setCanClick(true);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const handleCardClick = (index: number) => {
    if (!canClick) return;
    setCanClick(false);
    setSelectedIndex(index);

    const otherIndex = index === 0 ? 1 : 0;
    const isCorrect = askingHeavier 
      ? currentOptions[index].weight > currentOptions[otherIndex].weight
      : currentOptions[index].weight < currentOptions[otherIndex].weight;

    if (isCorrect) {
      playSound('correct');
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);

      // Add a random reward
      const prize = rewardsList[Math.floor(Math.random() * rewardsList.length)];
      setShelfItems(prev => [...prev, prize]);
      
      if (newScore >= MAX_SCORE) {
        setTimeout(() => {
          setIsCompleted(true);
          playSound('fanfare');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }, 1000);
      } else {
        setTimeout(setupRound, 1200);
      }
    } else {
      playSound('wrong');
      setFeedback('wrong');
      setTimeout(() => {
        setCanClick(true);
        setFeedback('none');
        setSelectedIndex(null);
      }, 1200);
    }
  };

  const resetGame = () => {
    setScore(0);
    setShelfItems([]);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#e1f5fe] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#01579b] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-[500px] mt-4 flex flex-col items-center z-10 flex-grow bg-white border-[4px] border-[#81d4fa] rounded-3xl p-6 shadow-[0_4px_10px_rgba(0,0,0,0.1)] relative">
        
        <h1 className="text-[#01579b] text-3xl font-black mb-2">⚖️ Heavy or Light? ⚖️</h1>
        
        <div className="text-2xl text-[#0277bd] mb-6 font-bold uppercase tracking-wide">
          Which one is <span className="text-[#0288d1] bg-[#e1f5fe] px-3 py-1 rounded-xl border-2 border-[#81d4fa]">{askingHeavier ? 'HEAVIER' : 'LIGHTER'}</span>?
        </div>

        {/* Feedback Message */}
        <div className="h-[40px] flex items-center justify-center font-bold text-2xl mb-2">
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div key="correct" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#2e7d32]">
                ⭐ Correct! ⭐
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div key="wrong" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-[#c62828]">
                Oops! Try again.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Options Stage */}
        <div className="w-full flex justify-around mb-6 relative">
          <AnimatePresence mode="popLayout">
            {currentOptions.map((option, index) => {
              const isSelected = selectedIndex === index;
              const bgColor = isSelected 
                ? (feedback === 'correct' ? '#a5d6a7' : '#ef9a9a')
                : '#b3e5fc';

              return (
                <motion.div
                  key={`card-${option.name}-${score}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, backgroundColor: bgColor }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={canClick ? { scale: 1.05, backgroundColor: "#81d4fa" } : {}}
                  whileTap={canClick ? { scale: 0.95 } : {}}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-[40%] flex flex-col justify-center items-center rounded-[15px] p-4 cursor-pointer min-h-[140px]"
                  onClick={() => handleCardClick(index)}
                >
                  <div className="text-[4rem] leading-none mb-3">{option.emoji}</div>
                  <div className="font-bold text-[#01579b] text-lg">{option.name}</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom Aquarium Shelf */}
        <div className="w-full bg-white border-[3px] border-dashed border-[#4fc3f7] rounded-xl p-4 mt-auto min-h-[100px]">
          <div className="text-sm text-[#0288d1] font-bold uppercase mb-2">🌊 Your Rescued Ocean Friends 🌊</div>
          <div className="flex justify-center flex-wrap gap-2 text-3xl">
            {shelfItems.map((item, idx) => (
              <motion.span 
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="text-lg font-bold text-[#0277bd] mt-4">Score: <span>{score}</span> / {MAX_SCORE}</div>

      </div>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              ⚖️
            </motion.div>
            <h1 className="text-[#0288d1] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">Ocean Guardian!</h1>
            <p className="text-2xl text-[#01579b] font-bold mb-8">You successfully weighed all the sea items!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#0288d1] hover:bg-[#0277bd] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#0277bd] hover:shadow-[0_2px_0_#0277bd] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}