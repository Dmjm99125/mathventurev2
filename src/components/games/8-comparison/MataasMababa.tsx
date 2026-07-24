import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'correct' | 'wrong' | 'fanfare') => {
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
    gain.gain.setValueAtTime(0.2, now);
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
  }
};

interface MataasMababaProps {
  onComplete?: () => void;
}

const friends = ['🕊️', '🎈', '🪁', '🚁', '🐝', '🦸'];

export function MataasMababa({ onComplete }: MataasMababaProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [isLookingForHigh, setIsLookingForHigh] = useState(true);
  const [currentFriend, setCurrentFriend] = useState('🕊️');
  const [leftIsHigh, setLeftIsHigh] = useState(true);
  
  const [feedback, setFeedback] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [stars, setStars] = useState<{ id: number, x: number, y: number }[]>([]);

  const setupRound = () => {
    setFeedback("");
    setIsLookingForHigh(Math.random() > 0.5);
    setCurrentFriend(friends[Math.floor(Math.random() * friends.length)]);
    setLeftIsHigh(Math.random() > 0.5);
  };

  useEffect(() => {
    setupRound();
  }, []);

  const triggerStarBurst = () => {
    const newStars = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400
    }));
    setStars(newStars);
    setTimeout(() => setStars([]), 1000);
  };

  const handleChoice = (side: 'left' | 'right') => {
    if (feedback === "Ang galing! ⭐") return;

    const targetSide = isLookingForHigh ? (leftIsHigh ? 'left' : 'right') : (leftIsHigh ? 'right' : 'left');

    if (side === targetSide) {
      playSound('correct');
      setFeedback("Ang galing! ⭐");
      triggerStarBurst();
      const newScore = score + 1;
      setScore(newScore);
      
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
      setFeedback("Subukan muli! 💪");
    }
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-gradient-to-b from-[#87CEEB] to-[#E0F7FA] rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-auto mb-auto flex flex-col items-center z-10 flex-grow">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#2c3e50] mb-2 drop-shadow-sm">Laro: Mataas o Mababa? ☁️</h1>
        
        <div className="w-full flex justify-between px-4 mb-4 text-xl font-bold text-[#2c3e50]">
          <div className="flex items-center gap-1 bg-white/60 px-4 py-1 rounded-full">Puntos: <span className="text-[#2980b9]">{score}</span> / {MAX_SCORE}</div>
        </div>

        <div className="bg-white/90 border-2 border-[#3498db] px-8 py-4 rounded-[15px] shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-8 w-[90%] max-w-[500px]">
          <h2 className={`text-3xl md:text-4xl font-bold ${isLookingForHigh ? 'text-[#2980b9]' : 'text-[#e67e22]'}`}>
            {isLookingForHigh ? "Hanapin ang MATAAS" : "Hanapin ang MABABA"}
          </h2>
        </div>

        {/* Sky Area */}
        <div className="flex justify-center gap-10 md:gap-16 w-full h-[300px] mt-4 relative">
          
          <div className="w-[120px] h-full flex flex-col items-center relative">
            <motion.div
              className={`absolute w-full cursor-pointer flex justify-center text-6xl md:text-7xl drop-shadow-lg ${leftIsHigh ? 'top-0' : 'bottom-16'}`}
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleChoice('left')}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`left-${currentFriend}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {currentFriend}
                </motion.span>
              </AnimatePresence>
            </motion.div>
            <div className="absolute bottom-0 text-5xl md:text-6xl opacity-70 pointer-events-none">☁️</div>
          </div>

          <div className="w-[120px] h-full flex flex-col items-center relative">
            <motion.div
              className={`absolute w-full cursor-pointer flex justify-center text-6xl md:text-7xl drop-shadow-lg ${!leftIsHigh ? 'top-0' : 'bottom-16'}`}
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleChoice('right')}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={`right-${currentFriend}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {currentFriend}
                </motion.span>
              </AnimatePresence>
            </motion.div>
            <div className="absolute bottom-0 text-5xl md:text-6xl opacity-70 pointer-events-none">☁️</div>
          </div>

        </div>

        {/* Feedback Area */}
        <div className="h-[40px] flex items-center justify-center mt-6">
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                key={feedback}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`text-2xl md:text-3xl font-bold bg-white/80 px-6 py-2 rounded-full ${feedback === "Ang galing! ⭐" ? "text-[#27ae60]" : "text-[#c0392b]"}`}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Floating Stars */}
      <AnimatePresence>
        {stars.map(star => (
          <motion.div
            key={star.id}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: 1.5, x: star.x, y: star.y, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 text-5xl pointer-events-none z-50 -ml-6 -mt-6"
          >
            ⭐
          </motion.div>
        ))}
      </AnimatePresence>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#E0F7FA]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🎉
            </motion.div>
            <h1 className="text-[#2c3e50] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">NAPAKAHUSAY!</h1>
            <p className="text-2xl text-[#2c3e50] font-bold mb-8">Abot-langit ang iyong galing!</p>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={resetGame} className="bg-[#27ae60] hover:bg-[#1e8449] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#1e8449] hover:shadow-[0_2px_0_#1e8449] hover:translate-y-1 transition-all">
                Maglaro Muli 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}