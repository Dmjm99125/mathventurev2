import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import confetti from 'canvas-confetti';
import { ChevronRight } from 'lucide-react';

const playSound = (type: 'flip' | 'correct' | 'wrong' | 'fanfare' | 'pop' | 'pop_high') => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const now = ctx.currentTime;

  if (type === 'flip') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'correct') {
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
  } else if (type === 'pop_high') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  }
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const animalList = ["🐶","🐱","🐰","🐼","🐸","🐵","🐯","🦁","🐨"];
const rewards = ["🍭","🍩","🍪","🧁","🍫","🍬","🍦"];

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

interface CardData {
  id: string;
  value: string;
  pair: string;
  isMatched: boolean;
}

interface MatchingTypeAProps {
  onComplete?: () => void;
}

export function MatchingTypeA({ onComplete }: MatchingTypeAProps) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [animals, setAnimals] = useState<{ id: string, emoji: string, left: string }[]>([]);
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [giftState, setGiftState] = useState<'hidden' | 'box' | 'opened'>('hidden');
  const [giftEmoji, setGiftEmoji] = useState("");

  const startGame = () => {
    setIsCompleted(false);
    setFlippedIds([]);
    setMatches(0);
    setAnimals([]);
    setGiftState('hidden');

    const letters = shuffleArray(alphabet).slice(0, 6);
    let initialCards: CardData[] = [];

    letters.forEach(letter => {
      initialCards.push({ id: `upper_${letter}`, value: letter, pair: letter.toLowerCase(), isMatched: false });
      initialCards.push({ id: `lower_${letter}`, value: letter.toLowerCase(), pair: letter, isMatched: false });
    });

    setCards(shuffleArray(initialCards));
  };

  useEffect(() => {
    startGame();
  }, []);

  const handleCardClick = (id: string) => {
    if (flippedIds.length >= 2 || flippedIds.includes(id)) return;
    const clickedCard = cards.find(c => c.id === id);
    if (!clickedCard || clickedCard.isMatched) return;

    playSound('flip');
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      const card1 = cards.find(c => c.id === newFlipped[0])!;
      const card2 = cards.find(c => c.id === newFlipped[1])!;

      if (card1.pair === card2.value) {
        // Match!
        setTimeout(() => {
          playSound('correct');
          setCards(prev => prev.map(c => 
            (c.id === card1.id || c.id === card2.id) ? { ...c, isMatched: true } : c
          ));
          setFlippedIds([]);
          
          const newMatches = matches + 1;
          setMatches(newMatches);

          // Pop an animal every 2 matches
          if (newMatches % 2 === 0) {
            playSound('pop');
            setAnimals(prev => [
              ...prev, 
              { 
                id: Date.now().toString(), 
                emoji: animalList[Math.floor(Math.random() * animalList.length)], 
                left: `${Math.random() * 80 + 10}%` 
              }
            ]);
          }

          if (newMatches === 6) {
            setTimeout(() => {
              setIsCompleted(true);
              setGiftState('box');
              playSound('fanfare');
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }, 500);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          playSound('wrong');
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  const openGift = () => {
    if (giftState === 'box') {
      playSound('pop_high');
      setGiftEmoji(rewards[Math.floor(Math.random() * rewards.length)]);
      setGiftState('opened');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  return (
    <div className={`w-full max-w-4xl flex flex-col items-center p-6 rounded-[3rem] shadow-sm min-h-[600px] border-4 border-white relative font-display text-center select-none overflow-hidden transition-colors duration-1000 ${isCompleted ? 'bg-gradient-to-r from-red-200 via-yellow-200 to-blue-200' : 'bg-gradient-to-b from-[#cce7ff] to-white'}`}>
      
      {/* Skip Button */}
      <div className="absolute top-6 right-6 z-50">
        {onComplete && (
          <Button variant="ghost" className="text-[#2c3e50] font-bold bg-white/50 hover:bg-white" onClick={onComplete}>
            Skip <ChevronRight className="ml-1 w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="w-full max-w-lg mt-4 flex flex-col items-center z-10">
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#333] mb-6 drop-shadow-sm">Match Big & Small Letters</h1>
        
        {/* Game Grid */}
        <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-[400px] w-full mb-8 relative z-20">
          {cards.map(card => {
            const isFlipped = flippedIds.includes(card.id) || card.isMatched;
            return (
              <motion.div
                key={card.id}
                className="relative w-full h-[60px] md:h-[80px] cursor-pointer"
                onClick={() => handleCardClick(card.id)}
                whileHover={!isFlipped ? { scale: 1.05 } : {}}
                whileTap={!isFlipped ? { scale: 0.95 } : {}}
              >
                <motion.div
                  className="w-full h-full absolute inset-0"
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Back of card */}
                  <div className="absolute inset-0 w-full h-full bg-[#4CAF50] rounded-xl md:rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md border-b-4 border-[#388E3C]" style={{ backfaceVisibility: "hidden" }}>
                    ?
                  </div>
                  
                  {/* Front of card */}
                  <div className={`absolute inset-0 w-full h-full rounded-xl md:rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-bold shadow-md border-2 ${card.isMatched ? 'bg-yellow-300 text-yellow-900 border-yellow-400' : 'bg-white text-[#333] border-[#4CAF50]'}`} style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    {card.value}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Floating Animals */}
      <AnimatePresence>
        {animals.map(animal => (
          <motion.div
            key={animal.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: -200, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute bottom-0 text-5xl md:text-6xl pointer-events-none z-10"
            style={{ left: animal.left }}
          >
            {animal.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* End Game Overlay */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-white/40 z-[100] flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm rounded-[3rem]"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="text-[6rem] leading-none mb-2 drop-shadow-lg"
            >
              ⭐
            </motion.div>
            <h1 className="text-[#ff6600] text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-sm">Great job!</h1>
            
            {/* Gift Box Logic */}
            <div className="h-[120px] flex items-center justify-center mb-6">
              {giftState === 'box' && (
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  onClick={openGift}
                  className="text-7xl cursor-pointer drop-shadow-lg hover:scale-110 transition-transform"
                >
                  🎁
                </motion.div>
              )}
              {giftState === 'opened' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                  className="text-7xl drop-shadow-lg"
                >
                  {giftEmoji}
                </motion.div>
              )}
            </div>
            
            <div className="flex gap-4">
              <Button size="lg" onClick={startGame} className="bg-[#ff6600] hover:bg-[#e65c00] text-white text-2xl font-bold h-16 px-10 rounded-full shadow-[0_4px_0_#cc5200] hover:shadow-[0_2px_0_#cc5200] hover:translate-y-1 transition-all">
                Play Again 🔄
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}