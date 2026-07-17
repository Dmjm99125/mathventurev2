import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Eraser, Palette, Paintbrush, Save } from 'lucide-react';

const COLORS = [
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Red', value: '#e74c3c' },
  { name: 'Blue', value: '#3498db' },
  { name: 'Green', value: '#2ecc71' },
  { name: 'Yellow', value: '#f1c40f' },
  { name: 'Purple', value: '#9b59b6' },
  { name: 'Pink', value: '#fd79a8' },
];

export function DrawingCanvas({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0].value);
  const [lineWidth, setLineWidth] = useState(5);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      
      // Save canvas state if it was already drawn on
      let imgData: ImageData | null = null;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx && canvas.width > 0 && canvas.height > 0) {
         imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      if (ctx) {
        if (imgData) {
           ctx.putImageData(imgData, 0, 0);
        } else {
           ctx.fillStyle = 'white';
           ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    // Initial size
    resize();
    
    // Allow a small delay to ensure layout has settled (especially for modals/transitions)
    setTimeout(resize, 100);

    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Prevent scrolling while touching the canvas natively
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventTouchScroll = (e: TouchEvent) => e.preventDefault();
    canvas.addEventListener('touchstart', preventTouchScroll, { passive: false });
    canvas.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', preventTouchScroll);
      canvas.removeEventListener('touchmove', preventTouchScroll);
    };
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Only draw with primary pointer button
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const pos = getCoordinates(e);
    if (!pos) return;
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      
      // Draw a dot immediately
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFinish = () => {
    setShowConfirm(true);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'my-masterpiece.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-[100dvh] bg-gradient-to-b from-slate-100 to-slate-200 p-4 md:p-6 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 px-2 md:px-6">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-800 flex items-center gap-3">
          <Palette className="text-indigo-500 w-8 h-8 drop-shadow-sm" /> Shape Artist!
        </h1>
        {onComplete && (
          <Button 
            className="font-bold border-2 border-slate-300 rounded-xl shadow-md bg-white hover:bg-slate-50 text-slate-700" 
            onClick={handleFinish}
          >
             Finish Chapter 🏆
          </Button>
        )}
      </div>

      {/* Canvas Container */}
      <div 
        ref={containerRef} 
        className="w-full flex-1 bg-white rounded-3xl shadow-inner border-4 border-slate-300 overflow-hidden relative cursor-crosshair touch-none"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerOut={stopDrawing}
        />
      </div>

      {/* Controls Container */}
      <div className="w-full bg-white/80 backdrop-blur-md p-3 md:p-4 mt-4 rounded-3xl shadow-lg border-2 border-slate-200 flex flex-wrap gap-4 md:gap-8 justify-center items-center">
        
        {/* Colors */}
        <div className="flex gap-2 md:gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200">
          {COLORS.map(c => (
            <button
              key={c.name}
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full shadow-sm transition-transform ${color === c.value ? 'scale-125 ring-4 ring-white shadow-md' : 'hover:scale-110'}`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              title={c.name}
            />
          ))}
        </div>

        <div className="w-px h-10 bg-slate-300 hidden lg:block" />

        {/* Brush Size */}
        <div className="flex items-center gap-2 md:gap-4 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 flex-1 lg:flex-none justify-center min-w-[200px]">
          <Paintbrush className="text-slate-600 w-5 h-5 md:w-6 md:h-6" />
          <input 
            type="range" 
            min="1" 
            max="40" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24 md:w-40 accent-indigo-500 cursor-ew-resize"
          />
          <div 
            className="rounded-full bg-slate-800" 
            style={{ width: `${Math.min(lineWidth, 30)}px`, height: `${Math.min(lineWidth, 30)}px` }}
          />
        </div>

        <div className="w-px h-10 bg-slate-300 hidden lg:block" />

        {/* Actions */}
        <div className="flex gap-2 md:gap-4 w-full md:w-auto justify-center">
          <Button 
            variant="outline" 
            className="rounded-2xl font-bold shadow-md flex items-center gap-2 py-6 px-4 md:px-6 bg-white hover:bg-blue-50 text-blue-600 border-blue-200"
            onClick={downloadImage}
          >
            <Save className="w-5 h-5" /> Save
          </Button>
          
          <Button 
            variant="destructive" 
            className="rounded-2xl font-bold shadow-md flex items-center gap-2 py-6 px-4 md:px-6"
            onClick={clearCanvas}
          >
            <Eraser className="w-5 h-5" /> Clear
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-4 border-slate-200 text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Finish Chapter?</h2>
            <p className="text-slate-600 mb-8 text-lg">
              Are you sure you want to leave? Make sure to <span className="font-bold text-blue-500">save your drawing</span> first so you don't lose it!
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                variant="outline" 
                className="rounded-xl font-bold border-2 border-slate-300 px-6 py-6"
                onClick={() => setShowConfirm(false)}
              >
                Go Back
              </Button>
              <Button 
                className="rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-md px-6 py-6"
                onClick={() => {
                  setShowConfirm(false);
                  onComplete?.();
                }}
              >
                Yes, I'm Done!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
