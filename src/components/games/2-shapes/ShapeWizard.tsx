import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Heart, Star, Trophy } from 'lucide-react';

const CHARACTERS = ['🐰', '🐼', '🦕', '🦄'];
const SHAPES = ['circle', 'square', 'triangle', 'star'];
const GIFTS = ["🍦", "🚁", "🚲", "🎨", "🎮", "🎸", "🏆", "💎", "👑", "🍕"];

const WORLDS = [
  { id: 'jungle', name: '🌴 Jungle', cost: 0, color: 'from-[#2ecc71] to-[#27ae60]', text: 'text-green-900' },
  { id: 'space', name: '🚀 Space', cost: 100, color: 'from-[#2c3e50] to-[#1a252f]', text: 'text-white' }
];

export function ShapeWizard({ onComplete }: { onComplete?: () => void }) {
  const [screen, setScreen] = useState('start'); // start, char-select, world-map, game, reward, game-over
  const [stars, setStars] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [character, setCharacter] = useState('🐰');
  const [world, setWorld] = useState(WORLDS[0]);
  const [rewards, setRewards] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetShape, setTargetShape] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [latestReward, setLatestReward] = useState('');

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (screen === 'game' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 0.1) {
            clearInterval(interval);
            setScreen('game-over');
            return 0;
          }
          return t - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [screen, timeLeft]);

  const nextRound = () => {
    const target = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setTargetShape(target);

    const opts = [...SHAPES].sort(() => Math.random() - 0.5).slice(0, 3);
    if (!opts.includes(target)) opts[0] = target;
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const startGame = () => {
    setScreen('game');
    setTimeLeft(30);
    setLives(3);
    nextRound();
  };

  const handleShapeClick = (s: string) => {
    if (s === targetShape) {
      const oldStars = stars;
      const newStars = stars + 10;
      setStars(newStars);
      setTimeLeft(t => Math.min(t + 3, 30));

      if (Math.floor(newStars / 100) > Math.floor(oldStars / 100)) {
        setLevel(l => l + 1);
        const r = GIFTS[Math.floor(Math.random() * GIFTS.length)];
        setRewards(prev => [...prev, r]);
        setLatestReward(r);
        setScreen('reward');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        nextRound();
      }
    } else {
      setLives(l => {
        if (l <= 1) {
          setScreen('game-over');
          return 0;
        }
        return l - 1;
      });
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

  const getScreenClasses = () => {
    return "w-full h-full flex flex-col items-center justify-center p-4 absolute inset-0 z-10";
  };

  return (
    <div className={`w-full max-w-4xl mx-auto bg-gradient-to-b ${world.color} rounded-[3rem] shadow-2xl flex flex-col items-center relative overflow-hidden shrink-0 h-[600px] border-4 border-white/20 transition-colors duration-700`}>
      
      {/* Universal HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex gap-2 md:gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-sm pointer-events-auto">
            <Star className="text-yellow-400 fill-yellow-400 w-4 h-4 md:w-5 md:h-5" /> {stars}
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-sm pointer-events-auto">
            <Trophy className="text-blue-400 fill-blue-400 w-4 h-4 md:w-5 md:h-5" /> Level {level}
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold shadow-sm pointer-events-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart key={i} className={`w-4 h-4 md:w-5 md:h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-500 fill-gray-500 opacity-50'}`} />
            ))}
          </div>
        </div>
        
        {onComplete && (
          <Button 
            variant="outline" 
            className="bg-white/90 border-2 border-purple-300 text-purple-700 font-bold hover:bg-purple-100 shadow-sm pointer-events-auto rounded-xl"
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
            <h1 className={`text-5xl md:text-7xl font-display font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8 tracking-widest text-center`}>
              Shape Wizard
            </h1>
            <Button size="lg" className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white font-bold text-3xl py-8 px-16 rounded-full shadow-[0_8px_0_0_#7d3c98] active:translate-y-2 active:shadow-none transition-all" onClick={() => setScreen('char-select')}>
              PLAY!
            </Button>
          </motion.div>
        )}

        {/* CHARACTER SELECT */}
        {screen === 'char-select' && (
          <motion.div key="char-select" className={getScreenClasses()} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <h3 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md mb-8">Pick a Buddy</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              {CHARACTERS.map(char => (
                <div 
                  key={char}
                  onClick={() => setCharacter(char)}
                  className={`text-6xl md:text-8xl p-6 rounded-3xl cursor-pointer transition-all ${character === char ? 'bg-white/40 border-4 border-[#f1c40f] scale-110 shadow-lg' : 'bg-white/20 border-4 border-transparent hover:bg-white/30 hover:scale-105'}`}
                >
                  {char}
                </div>
              ))}
            </div>
            <Button size="lg" className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white font-bold text-2xl py-6 px-16 rounded-full shadow-[0_6px_0_0_#7d3c98] active:translate-y-2 active:shadow-none transition-all" onClick={() => setScreen('world-map')}>
              CONTINUE
            </Button>
          </motion.div>
        )}

        {/* WORLD MAP */}
        {screen === 'world-map' && (
          <motion.div key="world-map" className={getScreenClasses()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            
            <div className="bg-black/40 p-4 md:p-6 rounded-3xl mb-8 w-full max-w-md border-2 border-white/20 shadow-inner backdrop-blur-sm text-center">
              <div className="text-sm md:text-base font-bold text-gray-300 mb-2 uppercase tracking-widest">My Rewards</div>
              <div className="text-3xl md:text-5xl min-h-[60px]">
                {rewards.length > 0 ? rewards.join(" ") : <span className="text-white/30 text-xl">Play to unlock rewards!</span>}
              </div>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md mb-8">Select World</h3>
            
            <div className="flex flex-col md:flex-row gap-6 w-full max-w-md justify-center">
              {WORLDS.map(w => {
                const isUnlocked = stars >= w.cost;
                const isSelected = world.id === w.id;
                return (
                  <Button
                    key={w.id}
                    variant={isSelected ? 'default' : 'secondary'}
                    size="lg"
                    className={`flex-1 py-8 text-xl md:text-2xl font-bold rounded-2xl shadow-lg border-2 ${isSelected ? 'border-[#f1c40f] ring-4 ring-[#f1c40f]/50' : 'border-transparent'} ${!isUnlocked && 'opacity-50 grayscale'}`}
                    onClick={() => {
                      if (isUnlocked) {
                        setWorld(w);
                      }
                    }}
                  >
                    {isUnlocked ? w.name : `🔒 ${w.cost} Stars`}
                  </Button>
                );
              })}
            </div>

            <Button size="lg" className="mt-12 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold text-3xl py-8 px-24 rounded-full shadow-[0_8px_0_0_#1e8449] active:translate-y-2 active:shadow-none transition-all" onClick={startGame}>
              GO!
            </Button>
          </motion.div>
        )}

        {/* GAME SCREEN */}
        {screen === 'game' && (
          <motion.div key="game" className={getScreenClasses()} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            
            <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border border-white/30 mb-12 mt-12 md:mt-0">
               <h3 className="text-2xl md:text-4xl font-bold text-white drop-shadow-md flex items-center gap-4">
                 <span className="text-4xl md:text-5xl bg-black/20 p-2 rounded-full">{character}</span>
                 <span>Find the <span className="text-[#f1c40f] uppercase tracking-wider">{targetShape}</span></span>
               </h3>
            </div>

            <div className="flex justify-center items-center gap-6 md:gap-12 w-full px-4">
              {options.map((shape, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-24 h-24 md:w-36 md:h-36 cursor-pointer drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] bg-white/10 rounded-3xl p-4 border-2 border-white/20 hover:bg-white/30 hover:border-white/60 transition-colors"
                  onClick={() => handleShapeClick(shape)}
                >
                  {getSVG(shape)}
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-8 md:bottom-12 w-3/4 max-w-xl h-4 md:h-6 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/20 p-1">
              <div 
                className={`h-full rounded-full transition-all duration-100 ease-linear ${timeLeft < 10 ? 'bg-red-500 animate-pulse' : 'bg-[#e74c3c]'}`} 
                style={{ width: `${(timeLeft / 30) * 100}%` }} 
              />
            </div>
          </motion.div>
        )}

        {/* REWARD SCREEN */}
        {screen === 'reward' && (
          <motion.div key="reward" className={getScreenClasses()} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5 }}>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold text-[#f1c40f] drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8">
              LEVEL UP!
            </h1>
            <motion.div 
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className="text-[120px] md:text-[160px] drop-shadow-2xl mb-12 bg-white/20 p-8 rounded-full border-4 border-[#f1c40f]"
            >
              {latestReward}
            </motion.div>
            <Button size="lg" className="bg-[#9b59b6] hover:bg-[#8e44ad] text-white font-bold text-2xl py-8 px-16 rounded-full shadow-[0_8px_0_0_#7d3c98] active:translate-y-2 active:shadow-none transition-all" onClick={() => {
               nextRound();
               setScreen('game');
            }}>
              CONTINUE
            </Button>
          </motion.div>
        )}

        {/* GAME OVER SCREEN */}
        {screen === 'game-over' && (
          <motion.div key="game-over" className={getScreenClasses()} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold text-red-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8 uppercase">
              {timeLeft <= 0.1 ? "Time's Up!" : "Game Over!"}
            </h1>
            <div className="text-2xl md:text-4xl text-white font-bold mb-12 drop-shadow-md">
              You reached <span className="text-[#f1c40f]">Level {level}</span> with <span className="text-[#f1c40f]">{stars} Stars</span>!
            </div>
            <Button size="lg" className="bg-[#34495e] hover:bg-[#2c3e50] text-white font-bold text-2xl py-8 px-16 rounded-full shadow-[0_8px_0_0_#1a252f] active:translate-y-2 active:shadow-none transition-all" onClick={() => {
               setStars(0);
               setLevel(1);
               setRewards([]);
               setScreen('world-map');
            }}>
              BACK TO MAP
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
