import React, { useState, useEffect, useRef } from 'react';
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
  } else if (type === 'pop') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  }
};

interface AyusinAngLakiProps {
  onComplete?: () => void;
}

const emojiSet = ["🍎", "🐘", "🚗", "🧸", "🐱", "🍦", "🌸", "🍔", "🦁"];
type Size = 'small' | 'medium' | 'large';

const sizeMap = {
  'small': 'text-4xl md:text-5xl',
  'medium': 'text-6xl md:text-7xl',
  'large': 'text-8xl md:text-[7rem]'
};

export function AyusinAngLaki({ onComplete }: AyusinAngLakiProps) {
  const MAX_SCORE = 10;
  
  const [score, setScore] = useState(0);
  const [isSmallToBig, setIsSmallToBig] = useState(true);
  const [currentEmoji, setCurrentEmoji] = useState("🍎");
  const [bankItems, setBankItems] = useState<Size[]>([]);
  const [placedItems, setPlacedItems] = useState<(Size | null)[]>([null, null, null]);
  const [feedback, setFeedback] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [stars, setStars] = useState<{ id: number, x: number, y: number }[]>([]);

  // Fisher-Yates shuffle for fair randomness
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const setupRound = () => {
    setFeedback("");
    setCurrentEmoji(emojiSet[Math.floor(Math.random() * emojiSet.length)]);
    setIsSmallToBig(Math.random() > 0.5);
    setPlacedItems([null, null, null]);
    setBankItems(shuffleArray(['small', 'medium', 'large']));
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

  const handleBankClick = (size: Size) => {
    if (feedback !== "") return; // Disable clicking if feedback is showing

    const emptyIndex = placedItems.findIndex(item => item === null);
    if (emptyIndex !== -1) {
      playSound('pop');
      
      const newPlaced = [...placedItems];
      newPlaced[emptyIndex] = size;
      setPlacedItems(newPlaced);
      
      const newBank = [...bankItems];
      newBank.splice(newBank.indexOf(size), 1);
      setBankItems(newBank);

      // Check win if full
      if (newPlaced.every(item => item !== null)) {
        checkWin(newPlaced as Size[]);
      }
    }
  };

  const handlePlacedClick = (size: Size | null, index: number) => {
    if (feedback !== "" && feedback !== "Mali ang pagkakasunod-sunod...") return;
    if (!size) return;
    
    // Clear feedback if they are correcting a mistake
    if (feedback === "Mali ang pagkakasunod-sunod...") {
      setFeedback("");
    }

    playSound('pop');
    
    const newPlaced = [...placedItems];
    newPlaced[index] = null;
    setPlacedItems(newPlaced);
    
    setBankItems(prev => [...prev, size]);
  };

  const checkWin = (placed: Size[]) => {
    let correct = false;
    if (isSmallToBig) {
      correct = (placed[0] === 'small' && placed[1] === 'medium' && placed[2] === 'large');
    } else {
      correct = (placed[0] === 'large' && placed[1] === 'medium' && placed[2] === 'small');
    }

    if (correct) {
      playSound('correct');
      setFeedback("Ang galing! Tama! ⭐");
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
      setFeedback("Mali ang pagkakasunod-sunod...");
    }
  };

  const retryPlacement = () => {
    const returnedItems = placedItems.filter(item => item !== null) as Size[];
    setBankItems(prev => [...prev, ...returnedItems]);
    setPlacedItems([null, null, null]);
    setFeedback("");
  };

  const resetGame = () => {
    setScore(0);
    setIsCompleted(false);
    setupRound();
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center p-6 bg-[#fdfefe] rounded-[3rem] shadow-sm min-h-[650px] border-4 border-white relative font-display text-center select-none overflow-hidden">
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-4 flex flex-col items-center z-10 flex-grow">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#2980b9] mb-2 drop-shadow-sm">Pag-aayos ng Laki</h1>
        
        <div className="w-full flex justify-between px-4 mb-4 text-xl font-bold text-[#2c3e50]">
          <div className="flex items-center gap-1">Puntos: <span className="text-[#2980b9]">{score}</span> / {MAX_SCORE}</div>
        </div>

        <div className="bg-white px-8 py-4 rounded-[15px] shadow-[0_4px_8px_rgba(0,0,0,0.1)] mb-8 w-[90%] max-w-[500px]">
          <h2 className={`text-3xl md:text-4xl font-bold ${isSmallToBig ? 'text-[#2980b9]' : 'text-[#e67e22]'}`}>
            {isSmallToBig ? "Maliit ➡️ Malaki" : "Malaki ➡️ Maliit"}
          </h2>
        </div>

        {/* Drop Zones */}
        <div className="flex justify-center gap-4 md:gap-6 mb-8 w-full max-w-[400px]">
          {placedItems.map((item, i) => (
            <motion.div
              key={`zone-${i}`}
              className="w-24 h-28 md:w-32 md:h-36 border-4 border-dashed border-[#95a5a6] rounded-2xl flex items-center justify-center bg-white/60 cursor-pointer shadow-inner relative"
              onClick={() => handlePlacedClick(item, i)}
              whileHover={item ? { scale: 1.05 } : {}}
              whileTap={item ? { scale: 0.95 } : {}}
            >
              <AnimatePresence mode="popLayout">
                {item && (
                  <motion.div
                    key={item}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={sizeMap[item]}
                  >
                    {currentEmoji}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Bank Area */}
        <div className="flex justify-center items-end gap-6 md:gap-10 h-[150px] bg-[#f1f2f6] w-full rounded-3xl p-6 shadow-inner border-2 border-[#dfe4ea]">
          <AnimatePresence mode="popLayout">
            {bankItems.map((item) => (
              <motion.div
                key={`bank-${item}`}
                layoutId={`bank-${item}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`${sizeMap[item]} cursor-pointer hover:drop-shadow-lg flex items-center justify-center`}
                onClick={() => handleBankClick(item)}
                whileHover={{ y: -10, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {currentEmoji}
              </motion.div>
            ))}
          </AnimatePresence>
          {bankItems.length === 0 && (
            <div className="text-[#a4b0be] font-bold text-xl w-full h-full flex items-center justify-center">
              Wala nang laman
            </div>
          )}
        </div>

        {/* Feedback & Actions */}
        <div className="mt-8 flex flex-col items-center justify-center min-h-[80px]">
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                key={feedback}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`text-2xl md:text-3xl font-bold mb-4 ${feedback === "Ang galing! Tama! ⭐" ? "text-[#27ae60]" : "text-[#e74c3c]"}`}
              >
                {feedback}
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {feedback === "Mali ang pagkakasunod-sunod..." && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
              >
                <Button 
                  size="lg" 
                  onClick={retryPlacement}
                  className="bg-[#e74c3c] hover:bg-[#c0392b] text-white text-xl font-bold rounded-xl shadow-[0_4px_0_#c0392b] hover:shadow-[0_2px_0_#c0392b] hover:translate-y-1 transition-all"
                >
                  Subukan Muli 🔄
                </Button>
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
            className="absolute inset-0 bg-[#fdfefe]/95 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[6rem] leading-none mb-4 drop-shadow-lg"
            >
              🌟
            </motion.div>
            <h1 className="text-[#2980b9] text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-sm">NAPAKAHUSAY!</h1>
            <p className="text-2xl text-[#2c3e50] font-bold mb-8">Ikaw ay isang dalubhasa sa paghahambing!</p>
            
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