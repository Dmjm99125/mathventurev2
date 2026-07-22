import React from 'react';
import type { LessonSlide } from '@/data/lessonContent';
import { AudioButton } from '@/components/AudioButton';
import { Card } from '@/components/ui';

interface LessonSlideProps {
  slide: LessonSlide;
  /** 1-indexed slide number */
  index: number;
  total: number;
}

export function LessonSlideCard({ slide, index, total }: LessonSlideProps) {
  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-400">
      {/* Slide counter */}
      <p className="text-sm font-bold text-muted-foreground tracking-wider uppercase">
        {index} of {total}
      </p>

      {/* Main media */}
      <Card className="p-6 border-4 border-primary/20 shadow-xl bg-white w-full flex items-center justify-center min-h-48">
        {slide.video ? (
          <video
            src={`/assets/videos/${slide.video}`}
            controls
            className="max-h-[380px] max-w-full rounded-xl shadow-md"
          />
        ) : (
          <img
            src={`/assets/images/${slide.image}`}
            alt={slide.labelEn}
            className="max-h-48 max-w-full object-contain drop-shadow-md"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </Card>

      {/* Bilingual labels + audio */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {/* English */}
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-2">
            <img src="/assets/images/1eng.png" alt="English" className="h-7 w-7 object-contain" />
            <span className="text-sm font-bold text-blue-700 uppercase tracking-wider">English</span>
          </div>
          <p className="text-2xl font-display font-extrabold text-blue-900 text-center">{slide.labelEn}</p>
          {slide.audioEn && (
            <AudioButton src={slide.audioEn} className="h-12 w-12" />
          )}
        </div>

        {/* Filipino */}
        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-yellow-50 border-2 border-yellow-200">
          <div className="flex items-center gap-2">
            <img src="/assets/images/1fil.png" alt="Filipino" className="h-7 w-7 object-contain" />
            <span className="text-sm font-bold text-yellow-700 uppercase tracking-wider">Filipino</span>
          </div>
          <p className="text-2xl font-display font-extrabold text-yellow-900 text-center">{slide.labelFil}</p>
          {slide.audioFil && (
            <AudioButton src={slide.audioFil} className="h-12 w-12" />
          )}
        </div>
      </div>
    </div>
  );
}
