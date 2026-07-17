import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Star } from 'lucide-react';

const SHAPES = ['circle', 'square', 'triangle', 'star'];
const REWARDS = ["👑", "💍", "🍦", "🍗", "🍕", "🎮", "🎸", "🚲", "🎨", "🚀", "🛸"];

export function HungryDragon({ onComplete }: { onComplete?: () => void }) {
  const [screen, setScreen] = useState('start'); // start, game, reward, game-over
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(25);
  const [targetShape, setTargetShape] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [options, setOptions] = useState<{id: number, shape: string, hidden: boolean, wrong: boolean}[]>([]);
  const [rewards, setRewards] = useState<string[]>(["💎"]);
  const [latestReward, setLatestReward] = useState('');

  const nextRound = () => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const amount = Math.floor(Math.random() * 3) + 2; // 2 to 4
    setTargetShape(shape);
    setTargetAmount(amount);
    setFoundCount(0);
    setTimeLeft(25);

    const opts = [];
    for (let i = 0; i < amount; i++) opts.push(shape);
    while (opts.length < 12) {
      opts.push(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    }
    opts.sort(() => Math.random() - 0.5);
    setOptions(opts.map((s, i) => ({ id: i, shape: s, hidden: false, wrong: false })));
  };

  const startGame = () => {
    setScore(0);
    setLives(3);
    setScreen('game');
    nextRound();
  };

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (screen === 'game' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          const difficulty = 0.2 + (Math.floor(score / 100) * 0.05);
          const next = t - difficulty;
          
          if (next <= 0) {
            clearInterval(interval);
            setTimeout(() => {
              setLives(l => {
                if (l <= 1) {
                  setScreen('game-over');
                  return 0;
                }
                nextRound();
                return l - 1;
              });
            }, 0);
            return 0;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [screen, timeLeft, score]);

  const handleShapeClick = (idx: number) => {
    if (screen !== 'game' || options[idx].hidden || timeLeft <= 0) return;

    if (options[idx].shape === targetShape) {
      const newFound = foundCount + 1;
      setFoundCount(newFound);
      
      setOptions(prev => prev.map((o, i) => i === idx ? { ...o, hidden: true } : o));

      if (newFound >= targetAmount) {
        const newScore = score + 10;
        setScore(newScore);
        if (Math.floor(newScore / 100) > Math.floor(score / 100)) {
          const r = REWARDS[Math.floor(Math.random() * REWARDS.length)];
          setRewards(prev => [...prev, r]);
          setLatestReward(r);
          setScreen('reward');
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        } else {
          setTimeout(nextRound, 400);
        }
      }
    } else {
      setTimeLeft(t => Math.max(t - 4, 0));
      setOptions(prev => prev.map((o, i) => i === idx ? { ...o, wrong: true } : o));
      setTimeout(() => {
        setOptions(prev => prev.map((o, i) => i === idx ? { ...o, wrong: false } : o));
      }, 300);
    }
  };

  const getSVG = (type: string) => {
    const c = { circle: '#e74c3c', square: '#fff', triangle: '#2ecc71', star: '#f1c40f' };
    if (type === 'circle') return <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><circle cx="50" cy="50" r="40" fill={c.circle}/></svg>;
    if (type === 'square') return <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><rect x="15" y="15" width="70" height="70" fill={c.square}/></svg>;
    if (type === 'triangle') return <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><polygon points="50,15 85,85 15,85" fill={c.triangle}/></svg>;
    if (type === 'star') return <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><polygon points="50,5 63,35 95,35 70,55 80,85 50,70 20,85 30,55 5,35 37,35" fill={c.star}/></svg>;
    return null;
  };

  const getScreenClasses = () => "w-full h-full flex flex-col items-center justify-center p-4 md:p-6 absolute inset-0 z-10";

  return (
    <div className={`w-full max-w-4xl mx-auto bg-gradient-to-br from-[#2ecc71] to-[#1e8449] rounded-[3rem] shadow-2xl flex flex-col items-center relative overflow-hidden shrink-0 h-[600px] border-4 border-[#34495e]`}>
      
      {/* Universal HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-sm pointer-events-auto">
            <Star className="text-yellow-400 fill-yellow-400 w-5 h-5" /> {score}
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-sm pointer-events-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-500 fill-gray-500 opacity-50'}`} />
            ))}
          </div>
        </div>
        
        {onComplete && (
          <Button 
            variant="outline" 
            className="bg-white/90 border-2 border-green-300 text-green-800 font-bold hover:bg-green-100 shadow-sm pointer-events-auto rounded-xl"
            onClick={onComplete}
          >
            Next Game ➡️
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* START SCREEN */}
        {screen === 'start' && (
          <motion.div key="start" className={getScreenClasses()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <div className="bg-black/30 px-6 py-2 rounded-full text-white font-bold mb-6 flex gap-2 text-xl drop-shadow-md">
              Hoard: <span>{rewards.join(" ")}</span>
            </div>
            
            <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="text-[120px] mb-4 drop-shadow-2xl">
              🐲
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8 tracking-widest text-center">
              Hungry Dragon
            </h1>

            <Button size="lg" className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white font-bold text-2xl md:text-3xl py-8 px-12 md:px-16 rounded-full shadow-[0_8px_0_0_#7d3c98] active:translate-y-2 active:shadow-none transition-all" onClick={startGame}>
              START FEEDING
            </Button>
          </motion.div>
        )}

        {/* GAME SCREEN */}
        {screen === 'game' && (
          <motion.div key="game" className={getScreenClasses()} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            
            <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} className="text-[80px] drop-shadow-xl z-20 mt-8 md:mt-4">
              🐲
            </motion.div>

            <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border-4 border-[#34495e] mb-6 md:mb-8 -mt-4 z-30">
               <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                 Feed me <span className="text-[#e74c3c] font-black">{targetAmount} {targetShape.toUpperCase()}S</span>!
               </h2>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-lg mb-8 px-4 z-10 place-items-center">
              {options.map((opt) => (
                <motion.div 
                  key={opt.id}
                  whileHover={!opt.hidden ? { scale: 1.1 } : {}}
                  whileTap={!opt.hidden ? { scale: 0.9 } : {}}
                  animate={{ opacity: opt.hidden ? 0 : opt.wrong ? 0.3 : 1, scale: opt.hidden ? 0.5 : 1 }}
                  className={`w-16 h-16 md:w-20 md:h-20 ${!opt.hidden ? 'cursor-pointer' : 'pointer-events-none'}`}
                  onClick={() => handleShapeClick(opt.id)}
                >
                  {getSVG(opt.shape)}
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-8 w-3/4 max-w-xl h-5 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/20 p-1">
              <div 
                className={`h-full rounded-full transition-all duration-100 ease-linear ${timeLeft < 10 ? 'bg-[#e74c3c] animate-pulse' : 'bg-[#f1c40f]'}`} 
                style={{ width: `${(timeLeft / 25) * 100}%` }} 
              />
            </div>
          </motion.div>
        )}

        {/* REWARD SCREEN */}
        {screen === 'reward' && (
          <motion.div key="reward" className="w-full h-full flex flex-col items-center justify-center p-4 absolute inset-0 z-10 bg-gradient-to-b from-[#9b59b6] to-[#8e44ad]" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold text-[#f1c40f] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-4 text-center">
              TREASURE!
            </h1>
            <p className="text-xl md:text-2xl text-white font-bold mb-8 text-center drop-shadow-md">
              The Dragon gave you a gift for 100 points!
            </p>
            <motion.div 
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="text-[120px] md:text-[140px] drop-shadow-2xl mb-12 bg-white/20 p-8 rounded-full border-4 border-[#f1c40f]"
            >
              {latestReward}
            </motion.div>
            <Button size="lg" className="bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold text-2xl py-8 px-16 rounded-full shadow-[0_8px_0_0_#1e8449] active:translate-y-2 active:shadow-none transition-all" onClick={() => {
               nextRound();
               setScreen('game');
            }}>
              KEEP FEEDING
            </Button>
          </motion.div>
        )}

        {/* GAME OVER SCREEN */}
        {screen === 'game-over' && (
          <motion.div key="game-over" className="w-full h-full flex flex-col items-center justify-center p-4 absolute inset-0 z-10 bg-gradient-to-b from-gray-800 to-gray-900" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold text-red-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8 uppercase text-center">
              Game Over!
            </h1>
            <div className="text-2xl md:text-3xl text-gray-300 font-bold mb-12 drop-shadow-md text-center max-w-lg">
              The Dragon got too hungry and went to sleep!
              <br/><br/>
              <span className="text-white">You scored <span className="text-[#f1c40f]">{score} points</span>!</span>
            </div>
            <Button size="lg" className="bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold text-2xl py-8 px-16 rounded-full shadow-[0_8px_0_0_#922b21] active:translate-y-2 active:shadow-none transition-all" onClick={() => {
               setScreen('start');
            }}>
              BACK TO LAIR
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
