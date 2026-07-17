import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { CheckCircle2, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Item {
  id: string;
  emoji: string;
  color: string;
  matched: boolean;
}

const EMOJI_POOL = [
  // Red
  { emoji: '🍓', color: 'red' }, { emoji: '🍎', color: 'red' }, { emoji: '🍅', color: 'red' }, { emoji: '🚗', color: 'red' }, { emoji: '🎈', color: 'red' },
  // Green
  { emoji: '🍏', color: 'green' }, { emoji: '🌳', color: 'green' }, { emoji: '🐸', color: 'green' }, { emoji: '🐢', color: 'green' }, { emoji: '🍃', color: 'green' },
  // Yellow
  { emoji: '🌞', color: 'yellow' }, { emoji: '🍌', color: 'yellow' }, { emoji: '🍋', color: 'yellow' }, { emoji: '🧀', color: 'yellow' }, { emoji: '🌻', color: 'yellow' },
  // Blue
  { emoji: '💧', color: 'blue' }, { emoji: '🦋', color: 'red' }, { emoji: '🐟', color: 'blue' }, { emoji: '🧢', color: 'blue' }, { emoji: '🧊', color: 'blue' },
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
    matched: false
  }));
};

interface ColorMatchingGameProps {
  onComplete?: (isCorrect: boolean) => void;
}

export function ColorMatchingGame({ onComplete }: ColorMatchingGameProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Randomize items on mount
  useEffect(() => {
    setItems(generateRandomItems());
  }, []);

  const handleMatch = (colorId: string) => {
    if (!selectedItemId) return;

    const item = items.find(i => i.id === selectedItemId);
    if (item && item.color === colorId) {
      setItems(prev => prev.map(i => i.id === selectedItemId ? { ...i, matched: true } : i));
      setSelectedItemId(null);
    } else {
      setSelectedItemId(null);
    }
  };

  const allMatched = items.length > 0 && items.every(i => i.matched);

  useEffect(() => {
    if (allMatched && !isCompleted) {
      setIsCompleted(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        setProgress(p => p + 1);
        setItems(generateRandomItems());
        setIsCompleted(false);
      }, 2000);
    }
  }, [allMatched, isCompleted]);

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
    const itemId = e.dataTransfer.getData('itemId');

    const item = items.find(i => i.id === itemId);
    if (item && item.color === colorId) {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, matched: true } : i));
    }
    setSelectedItemId(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
      <div className="w-full flex justify-end mb-4">
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold flex items-center gap-2">
          <Star className="w-5 h-5 fill-current" />
          Progress: {progress}
        </div>
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
          if (item.matched) return null; // Hide matched items

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

      {allMatched && (
        <div className="mt-8 text-2xl font-bold text-primary animate-bounce flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8" /> Great job! Next round...
        </div>
      )}
    </div>
  );
}
