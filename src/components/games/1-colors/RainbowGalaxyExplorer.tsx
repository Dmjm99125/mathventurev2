import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';

const GALAXY_COLORS = [
  { name: 'red', emoji: '❤️', planet: 'Mars Red', hex: '#ef4444' },
  { name: 'orange', emoji: '🟠', planet: 'Citrus Orbit', hex: '#f97316' },
  { name: 'yellow', emoji: '⭐', planet: 'Solar Base', hex: '#eab308' },
  { name: 'green', emoji: '🟢', planet: 'Emerald Moon', hex: '#22c55e' },
  { name: 'blue', emoji: '💎', planet: 'Oceanus', hex: '#3b82f6' },
  { name: 'purple', emoji: '🔮', planet: 'Nebula-9', hex: '#a855f7' }
];

interface RainbowGalaxyExplorerProps {
  onComplete?: () => void;
}

export function RainbowGalaxyExplorer({ onComplete }: RainbowGalaxyExplorerProps) {
  const [screen, setScreen] = useState<'start' | 'game' | 'end'>('start');
  const [pilot, setPilot] = useState('🐰');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [timer, setTimer] = useState(30);
  const [endMessage, setEndMessage] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [stars, setStars] = useState<{ id: string, left: string, top: string, opacity: number }[]>([]);

  useEffect(() => {
    // Generate background stars
    const newStars = Array.from({ length: 50 }).map(() => ({
      id: Math.random().toString(36).substring(7),
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      opacity: Math.random()
    }));
    setStars(newStars);
  }, []);

  useEffect(() => {
    if (screen === 'game' && timer > 0) {
      const interval = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(interval);
            setEndMessage("Time ran out! But you explored well!");
            setScreen('end');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [screen, timer]);

  const generateAsteroids = useCallback((currentLevel: number) => {
    const target = GALAXY_COLORS[currentLevel].hex;
    const choices = [target];
    const available = GALAXY_COLORS.map(c => c.hex).filter(h => h !== target);
    
    while (choices.length < 4) {
      const randomColor = available[Math.floor(Math.random() * available.length)];
      if (!choices.includes(randomColor)) choices.push(randomColor);
    }
    setOptions(choices.sort(() => Math.random() - 0.5));
  }, []);

  const startGame = (p: string) => {
    setPilot(p);
    setScore(0);
    setLevel(0);
    setTimer(30);
    generateAsteroids(0);
    setScreen('game');
  };

  const handleChoice = (colorHex: string) => {
    const target = GALAXY_COLORS[level];
    if (colorHex === target.hex) {
      setScore(s => s + 10);
      
      if (level < GALAXY_COLORS.length - 1) {
        setLevel(l => l + 1);
        generateAsteroids(level + 1);
      } else {
        setEndMessage("You restored the Rainbow Galaxy!");
        setScreen('end');
      }
    } else {
      setScore(s => Math.max(0, s - 2));
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  };

  const getAura = () => {
    if (score >= 60) return "👑";
    if (score >= 40) return "🌟";
    if (score >= 20) return "✨";
    return "";
  };

  const currentTarget = GALAXY_COLORS[level] || GALAXY_COLORS[0];

  return (
    <div className="w-full max-w-4xl mx-auto h-[700px] flex flex-col relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#00f2ff]" style={{ backgroundColor: '#0b0e1e', color: 'white' }}>
      
      {/* Stars Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, #1b2735 0%, #090a0f 100%)', zIndex: 0 }}>
        {stars.map(s => (
          <div key={s.id} className="absolute w-[2px] h-[2px] bg-white rounded-full" style={{ left: s.left, top: s.top, opacity: s.opacity }} />
        ))}
      </div>

      {onComplete && (
        <Button 
          variant="outline" 
          className="absolute top-4 right-4 bg-transparent border-2 border-[#00f2ff] hover:bg-[#00f2ff]/20 text-[#00f2ff] font-bold rounded-xl shadow-[0_0_10px_#00f2ff] z-50"
          onClick={onComplete}
        >
          Next Game ➡️
        </Button>
      )}

      {/* Start Screen */}
      {screen === 'start' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 animate-in fade-in">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-8 text-center" style={{ textShadow: '0 0 15px #00f2ff' }}>🚀 RAINBOW GALAXY</h1>
          <p className="text-2xl mb-8 font-bold text-gray-300">Pick your Pilot:</p>
          <div className="grid grid-cols-2 gap-4 md:gap-8 w-full max-w-md">
            {['🐰', '🐱', '🐼', '🦄'].map(p => (
              <button
                key={p}
                className="text-2xl md:text-3xl p-6 bg-white/10 border-2 border-[#00f2ff] rounded-3xl text-white cursor-pointer transition-all hover:bg-white/20 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                onClick={() => startGame(p)}
              >
                {p} {p === '🐰' ? 'Bunny' : p === '🐱' ? 'Kitty' : p === '🐼' ? 'Panda' : 'Uni'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Screen */}
      {screen === 'game' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center p-4 pt-16 animate-in fade-in">
          
          {/* HUD */}
          <div className="absolute top-4 left-0 w-full px-4 flex justify-between gap-2 z-20">
            <div className="bg-black/60 px-4 py-2 rounded-2xl border border-gray-600 font-bold text-lg">✨ <span className="text-yellow-400">{score}</span></div>
            <div className="bg-black/60 px-4 py-2 rounded-2xl border border-[#00f2ff] font-bold text-lg text-[#00f2ff] truncate max-w-[150px] md:max-w-none">🌍 {currentTarget.planet}</div>
            <div className="bg-black/60 px-4 py-2 rounded-2xl border border-red-500 font-bold text-lg text-red-400">⏳ {timer}</div>
          </div>

          {/* Ship */}
          <div className={`relative my-8 transition-transform duration-300 ${shake ? 'translate-x-4' : ''} animate-[float_3s_ease-in-out_infinite]`}>
            <div className="absolute -top-4 left-4 text-4xl transition-all duration-500 z-10 drop-shadow-md">
              {pilot}{getAura()}
            </div>
            <div className="text-6xl md:text-7xl relative z-0 drop-shadow-[0_0_15px_#00f2ff]">🚀</div>
          </div>

          {/* Crystals Tray */}
          <div className="flex gap-2 my-4 bg-black/40 p-3 rounded-2xl border border-gray-700">
            {GALAXY_COLORS.map((c, i) => (
              <span key={c.name} className={`text-2xl transition-all duration-500 ${i < level ? 'opacity-100 grayscale-0 drop-shadow-[0_0_8px_white]' : 'opacity-30 grayscale'}`}>
                {c.emoji}
              </span>
            ))}
          </div>

          {/* Mission */}
          <div className="text-2xl md:text-3xl font-bold my-6 text-center drop-shadow-md">
            Collect <span style={{ color: currentTarget.hex, textShadow: `0 0 10px ${currentTarget.hex}` }}>{currentTarget.name.toUpperCase()}</span>
          </div>

          {/* Asteroids Board */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
            {options.map((hex, i) => (
              <div
                key={i}
                className="h-24 md:h-28 rounded-full border-4 border-white/30 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-lg relative overflow-hidden"
                style={{ backgroundColor: hex, boxShadow: `inset 0 0 20px rgba(0,0,0,0.5)` }}
                onClick={() => handleChoice(hex)}
              >
                {/* Asteroid texture effect */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,_white_0%,_transparent_50%)]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Victory / End Screen */}
      {screen === 'end' && (
        <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-center text-[#00f2ff]" style={{ textShadow: '0 0 20px #00f2ff' }}>
            {endMessage.includes("Time") ? "EXPLORATION COMPLETE!" : "GALAXY RESTORED! 🌈"}
          </h1>
          <div className="text-7xl my-6 drop-shadow-[0_0_30px_#ff00ff]">{pilot}{getAura()}</div>
          <p className="text-2xl mb-8 font-bold text-center">Final Score: <span className="text-yellow-400">{score}</span></p>
          
          <div className="flex flex-col gap-4">
            <Button size="lg" className="bg-[#ff00ff] hover:bg-[#ff00ff]/80 text-white font-bold text-xl py-6 rounded-2xl px-12 shadow-[0_0_15px_#ff00ff]" onClick={() => setScreen('start')}>
              Play Again
            </Button>
            {onComplete && (
              <Button size="lg" className="bg-[#00f2ff] hover:bg-[#00f2ff]/80 text-black font-bold text-xl py-6 rounded-2xl px-12 shadow-[0_0_15px_#00f2ff]" onClick={onComplete}>
                Next Game ➡️
              </Button>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}} />
    </div>
  );
}
