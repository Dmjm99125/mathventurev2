import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from '@/components/ui';
import { CheckCircle2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Item {
  id: string;
  emoji: string;
  color: string;
  matched: boolean;
  quizWrong: boolean;
}

const EMOJI_POOL = [
  // Red
  { emoji: '🍓', color: 'red' }, { emoji: '🍎', color: 'red' }, { emoji: '🍅', color: 'red' }, { emoji: '🚗', color: 'red' }, { emoji: '🎈', color: 'red' },
  // Green
  { emoji: '🍏', color: 'green' }, { emoji: '🌳', color: 'green' }, { emoji: '🐸', color: 'green' }, { emoji: '🐢', color: 'green' }, { emoji: '🍃', color: 'green' },
  // Yellow
  { emoji: '🌞', color: 'yellow' }, { emoji: '🍌', color: 'yellow' }, { emoji: '🍋', color: 'yellow' }, { emoji: '🧀', color: 'yellow' }, { emoji: '🌻', color: 'yellow' },
  // Blue
  { emoji: '💧', color: 'blue' }, { emoji: '🐞', color: 'red' }, { emoji: '🐟', color: 'blue' }, { emoji: '🧢', color: 'blue' }, { emoji: '🧊', color: 'blue' },
];

const COLORS = [
  { id: 'red', name: 'RED', hex: '#ef4444' },
  { id: 'blue', name: 'BLUE', hex: '#3b82f6' },
  { id: 'yellow', name: 'YELLOW', hex: '#eab308' },
  { id: 'green', name: 'GREEN', hex: '#22c55e' },
];

const generateRandomItems = (): Item[] => {
  // Pick 4 random items from the pool
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((item, index) => ({
    id: `${item.color}-${index}`,
    emoji: item.emoji,
    color: item.color,
    matched: false,
    quizWrong: false,
  }));
};

interface ColorMatchingGameProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function ColorMatchingGame({ onComplete, allowSkip = true }: ColorMatchingGameProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Randomize items on mount
  useEffect(() => {
    setTotalAttempts(0);
    setItems(generateRandomItems());
  }, []);

  const handleMatch = (colorId: string) => {
    if (!selectedItemId || isCompleted) return;

    const item = items.find(i => i.id === selectedItemId);
    if (!item) {
      setSelectedItemId(null);
      return;
    }
    setTotalAttempts(attempts => attempts + 1);
    if (item.color === colorId) {
      setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, matched: true } : i));
      setSelectedItemId(null);
    } else {
      if (allowSkip === false) {
        setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, quizWrong: true } : i));
      }
      setSelectedItemId(null);
    }
  };

  const allMatched = items.length > 0 && items.every(i => i.matched);
  const quizComplete = allowSkip === false && items.length > 0 && items.every(i => i.matched || i.quizWrong);
  const correctItems = items.filter(item => item.matched).length;
  const totalItems = totalAttempts;
  const completeGame = () => {
    if (onComplete) onComplete(correctItems, allowSkip === false ? items.length : totalItems);
  };

  useEffect(() => {
    const gameFinished = allowSkip === false ? quizComplete : allMatched;
    if (gameFinished && !isCompleted) {
      setIsCompleted(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      if (allowSkip !== false) {
        setTimeout(() => {
          setProgress(p => p + 1);
          setTotalAttempts(0);
          setItems(generateRandomItems());
          setIsCompleted(false);
        }, 2000);
      }
    }
  }, [allMatched, allowSkip, isCompleted, quizComplete]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('itemId', id);
    setSelectedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, colorId: string) => {
    e.preventDefault();
    if (isCompleted) return;
    const itemId = e.dataTransfer.getData('itemId');

    const item = items.find(i => i.id === itemId);
    if (!item) {
      setSelectedItemId(null);
      return;
    }
    setTotalAttempts(attempts => attempts + 1);
    if (item.color === colorId) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, matched: true } : i));
    } else {
      if (allowSkip === false) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, quizWrong: true } : i));
      }
      setSelectedItemId(null);
      return;
    }
    setSelectedItemId(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
      <div className="w-full flex flex-col gap-3 mb-4 px-4 md:flex-row md:items-center md:justify-between">
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold flex items-center gap-2">
          <Star className="w-5 h-5 fill-current" />
          Progress: {progress}
        </div>
        {onComplete && allowSkip !== false && (
          <Button 
            variant="default" 
            className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shadow-[0_4px_0_0_#e68a00] text-white px-6 h-10 w-full justify-center md:w-auto"
            onClick={() => onComplete()}
          >
            Next Game ➡️
          </Button>
        )}
      </div>

      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">🎨</span> Color Matching Game
        </h2>
        <p className="text-lg text-muted-foreground">Drag or touch the object to the correct color!</p>
      </div>

      {/* Color Buckets (Drop Zones) */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 w-full">
        {COLORS.map(color => (
          <div
            key={color.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, color.id)}
            onClick={() => handleMatch(color.id)}
            className="w-32 h-32 md:w-40 md:h-40 rounded-2xl flex items-center justify-center shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: color.hex }}
          >
            <span className="text-white font-black text-xl md:text-2xl tracking-wider drop-shadow-md">
              {color.name}
            </span>
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl border-t-2 border-dashed border-border mb-8"></div>

      {/* Draggable Items */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 min-h-[100px]">
        {items.map(item => {
          if (item.matched || item.quizWrong) return null; // Hide answered items

          const isSelected = selectedItemId === item.id;

          return (
            <Card
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onClick={() => setSelectedItemId(isSelected ? null : item.id)}
              className={`w-24 h-24 md:w-28 md:h-28 flex items-center justify-center text-5xl md:text-6xl cursor-grab active:cursor-grabbing transition-all ${isSelected ? 'ring-4 ring-primary scale-110 shadow-xl' : 'hover:scale-105 shadow-sm'
                }`}
            >
              {item.emoji}
            </Card>
          );
        })}
      </div>

      {(allMatched || quizComplete) && (
        <div className="mt-8 text-2xl font-bold text-primary animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8" /> {allowSkip === false ? `Quiz complete: ${correctItems}/${items.length}` : 'Great job! Next round...'}
        </div>
      )}

      {allowSkip === false && isCompleted && onComplete && (
        <Button
          size="lg"
          className="mt-6 rounded-full px-10 text-xl"
          onClick={completeGame}
        >
          Continue <CheckCircle2 className="ml-2 h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
