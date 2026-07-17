import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Star, Navigation } from 'lucide-react';

const SHAPES = ["Circle", "Square", "Rectangle", "Triangle", "Star"];
const REWARDS = ["🎈", "🐰", "🦄", "🌈", "🐱", "🎁", "⭐", "🚀"];
const TRACKS = [
  { id: 'jungle', class: 'from-[#8fd694] to-[#4caf50]' },
  { id: 'space', class: 'from-[#0f172a] to-[#312e81]' },
  { id: 'ocean', class: 'from-[#87ceeb] to-[#2196f3]' },
  { id: 'desert', class: 'from-[#f4d03f] to-[#e67e22]' },
];

export function ShapeRacing({ onComplete }: { onComplete?: () => void }) {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [trophies, setTrophies] = useState(0);
  const [targetShape, setTargetShape] = useState('');
  const [shuffledShapes, setShuffledShapes] = useState<string[]>([]);
  const [isRacing, setIsRacing] = useState(false);
  const [message, setMessage] = useState('');
  const [earnedRewards, setEarnedRewards] = useState<string[]>([]);
  const [trackTheme, setTrackTheme] = useState(TRACKS[0]);
  
  // Track cars progress
  const [carPositions, setCarPositions] = useState<Record<string, number>>({});
  const [carDurations, setCarDurations] = useState<Record<string, number>>({});

  const startRound = () => {
    setIsRacing(false);
    setMessage('');
    setCarPositions({});
    setTargetShape(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    setShuffledShapes([...SHAPES].sort(() => Math.random() - 0.5));
    setTrackTheme(TRACKS[Math.floor(Math.random() * TRACKS.length)]);
  };

  useEffect(() => {
    startRound();
  }, []);

  const handleRace = (choice: string) => {
    if (isRacing) return;
    setIsRacing(true);

    const newDurations: Record<string, number> = {};
    const newPositions: Record<string, number> = {};
    
    shuffledShapes.forEach(shape => {
      newPositions[shape] = 85; // 85% to the right (finish line)
      if (shape === targetShape) {
        newDurations[shape] = 0.7; // Fast
      } else {
        newDurations[shape] = 2.0 + Math.random(); // Slow
      }
    });

    setCarPositions(newPositions);
    setCarDurations(newDurations);

    setTimeout(() => {
      if (choice === targetShape) {
        const newScore = score + 1;
        setScore(newScore);
        setMessage(`🎉 ${choice} Wins! Great Job!`);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        if (newScore % 5 === 0) {
          setLevel(l => l + 1);
          setEarnedRewards(prev => [...prev, REWARDS[Math.floor(Math.random() * REWARDS.length)]]);
        }
        if (newScore > 0 && newScore % 10 === 0) {
          setTrophies(t => t + 1);
        }
      } else {
        setMessage(`❌ Oh no! The ${targetShape} won.`);
      }

      // Wait for slow cars to cross finish line
      setTimeout(startRound, 2500);
    }, 1000); // Check results slightly after fast car finishes (~0.7s)
  };

  const progressWidth = (score % 5) * 20;

  const renderShape = (shape: string) => {
    switch(shape) {
      case 'Circle':
        return <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-[#ff6b6b] shadow-md border-2 border-white/40" />;
      case 'Square':
        return <div className="w-10 h-10 md:w-14 md:h-14 bg-[#4ecdc4] shadow-md rounded-md border-2 border-white/40" />;
      case 'Rectangle':
        return <div className="w-14 h-8 md:w-20 md:h-12 bg-[#ffd93d] shadow-md rounded-md border-2 border-white/40" />;
      case 'Triangle':
        return (
          <div className="drop-shadow-md">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-[#6c5ce7]" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
          </div>
        );
      case 'Star':
        return <div className="text-[40px] md:text-[50px] text-[#ff9f43] leading-none drop-shadow-md">★</div>;
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto bg-gradient-to-b ${trackTheme.class} p-4 md:p-8 rounded-[3rem] shadow-2xl flex flex-col items-center relative overflow-hidden shrink-0 h-fit min-h-[600px] border-4 border-white/30 transition-colors duration-1000`}>
      
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center mb-6 flex-wrap gap-4 bg-white/90 p-4 rounded-3xl shadow-lg border border-white/50 backdrop-blur-sm z-10">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-800 tracking-wide flex-1 min-w-[200px]">🏁 Shape Racing</h1>
        
        <div className="flex gap-4 items-center flex-wrap justify-center">
          <div className="flex items-center gap-2 text-base md:text-xl font-bold text-gray-700 bg-orange-100 px-3 py-2 rounded-2xl shadow-sm border border-orange-200">
             <Star className="text-orange-500 fill-orange-500 w-5 h-5" /> Score: <span className="text-[#ff5722]">{score}</span>
          </div>
          <div className="flex items-center gap-2 text-base md:text-xl font-bold text-gray-700 bg-blue-100 px-3 py-2 rounded-2xl shadow-sm border border-blue-200">
             <Navigation className="text-blue-500 fill-blue-500 w-5 h-5" /> Level: <span className="text-blue-600">{level}</span>
          </div>
          <div className="flex items-center gap-2 text-base md:text-xl font-bold text-gray-700 bg-yellow-100 px-3 py-2 rounded-2xl shadow-sm border border-yellow-200">
             <Trophy className="text-yellow-500 fill-yellow-500 w-5 h-5" /> Trophies: <span className="text-yellow-600">{trophies}</span>
          </div>
          {onComplete && (
            <Button 
              variant="outline" 
              className="border-2 border-gray-300 font-bold hover:bg-gray-100 rounded-xl bg-white shadow-sm w-full md:w-auto"
              onClick={onComplete}
            >
              Next Game ➡️
            </Button>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white/95 px-6 md:px-8 py-3 md:py-4 rounded-3xl shadow-lg border-2 border-gray-200 mb-4 z-10 w-full max-w-2xl text-center">
        <h2 className="text-lg md:text-2xl font-bold text-gray-800">
          🎯 Tap the <span className="text-[#ff5722] underline decoration-4 underline-offset-4">{targetShape}</span> racer!
        </h2>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-2xl h-6 bg-white/50 rounded-full overflow-hidden shadow-inner mb-6 z-10 border-2 border-white/30 p-1">
        <div className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressWidth}%` }} />
      </div>

      {/* Race Area */}
      <div className="w-full flex flex-col gap-3 md:gap-4 mb-8 z-10">
        {shuffledShapes.map((shape) => (
          <div key={shape} className="w-full h-16 md:h-20 bg-gray-800/80 rounded-xl relative overflow-hidden border-2 border-gray-900 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center">
            {/* Track line (dashed middle line) */}
            <div className="absolute inset-x-0 top-1/2 border-t-4 border-white/20 border-dashed transform -translate-y-1/2 z-0" />
            
            {/* Finish Line Checkered Pattern */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-8 md:w-16 z-0" 
              style={{ 
                background: 'conic-gradient(#fff 90deg, #000 90deg 180deg, #fff 180deg 270deg, #000 270deg)',
                backgroundSize: '16px 16px' 
              }} 
            />

            {/* Car */}
            <motion.div
              className="absolute left-2 md:left-4 z-10 cursor-pointer drop-shadow-xl flex items-center justify-center"
              animate={{ left: `${carPositions[shape] || 2}%` }}
              transition={{ duration: carDurations[shape] || 0, ease: "easeInOut" }}
              whileHover={{ scale: isRacing ? 1 : 1.1 }}
              whileTap={{ scale: isRacing ? 1 : 0.95 }}
              onClick={() => handleRace(shape)}
            >
              {renderShape(shape)}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Message */}
      <div className="h-16 mb-4 flex items-center justify-center w-full z-10 pointer-events-none">
        <p className={`text-xl md:text-3xl font-bold transition-all bg-white/90 px-6 py-3 rounded-2xl shadow-lg border-2 ${message.includes('🎉') ? 'text-green-600 scale-110 border-green-200 opacity-100' : message ? 'text-red-500 animate-bounce border-red-200 opacity-100' : 'opacity-0 scale-90'}`}>
          {message}
        </p>
      </div>

      {/* Rewards Collection */}
      <div className="w-full max-w-3xl flex flex-col items-center mt-auto z-10">
        <div className="bg-white/80 w-full min-h-[80px] rounded-3xl border-2 border-white p-4 flex flex-wrap gap-4 justify-center items-center shadow-lg backdrop-blur-sm">
          <AnimatePresence>
            {earnedRewards.length === 0 ? (
               <div className="text-gray-500 font-bold italic text-sm md:text-base">Win races to unlock sticker rewards!</div>
            ) : (
              earnedRewards.map((reward, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-3xl md:text-4xl drop-shadow-md"
                >
                  {reward}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
