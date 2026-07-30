import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui";
import type { PortalTopicEntry, PortalTopicId } from "@/lib/student/portal";
import { cn } from "@/lib/shared/utils";

const headerAssets = [
  { key: "let", src: "/assets/images/1let.png", fallback: "Let's Learn!" },
  { key: "lets", src: "/assets/images/1lets.png", fallback: "Tayo ay Matuto!" },
] as const;

export function LegacyLessonMenu({
  topics,
  highlightedLessonId,
  onSelect,
}: {
  topics: PortalTopicEntry[];
  highlightedLessonId: PortalTopicId | null;
  onSelect: (href: string) => void;
}) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const topicState = useMemo(() => {
    return topics.map((topic) => ({
      ...topic,
      isBroken: brokenImages[topic.id] === true,
    }));
  }, [brokenImages, topics]);

  return (
    <section className="relative z-10 flex min-h-[560px] flex-col gap-4 rounded-[28px] bg-white/8 p-4 backdrop-blur-[1px] md:p-6">
      <header className="grid gap-3 md:grid-cols-2 md:items-center">
        {headerAssets.map((asset) => {
          const broken = brokenImages[asset.key] === true;

          return broken ? (
            <div
              key={asset.key}
              className="rounded-2xl bg-white/80 px-4 py-3 text-center text-xl font-extrabold text-primary shadow-sm"
            >
              {asset.fallback}
            </div>
          ) : (
            <img
              key={asset.key}
              src={asset.src}
              alt={asset.fallback}
              className="w-full object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.16)]"
              onError={() => setBrokenImages((current) => ({ ...current, [asset.key]: true }))}
            />
          );
        })}
      </header>

      <div className="grid gap-2">
        {topicState.map((topic) => {
          const isHighlighted = highlightedLessonId === topic.id;

          return (
            <Button
              key={topic.id}
              type="button"
              variant="ghost"
              onClick={() => onSelect(topic.href)}
              className={cn(
                "group grid min-h-[56px] grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[22px] border border-transparent bg-white/10 px-3 py-2 text-left shadow-[0_8px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm hover:bg-white/18",
                isHighlighted && "border-white/70 bg-white/22 ring-2 ring-jungle-yellow/60",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-400 text-sm font-extrabold text-white shadow-sm">
                {topic.lessonNumber}
              </span>

              {topic.isBroken ? (
                <span className="truncate text-lg font-extrabold uppercase tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]">
                  {topic.fallbackLabel}
                </span>
              ) : (
                <img
                  src={topic.assetSrc}
                  alt={topic.fallbackLabel}
                  className="max-h-10 w-full object-contain object-left drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]"
                  onError={() => setBrokenImages((current) => ({ ...current, [topic.id]: true }))}
                />
              )}

              <div className="flex items-center gap-2">
                {topic.isAssigned && (
                  <span
                    className="h-3 w-3 rounded-full bg-jungle-orange shadow-sm"
                    aria-hidden="true"
                  />
                )}
                {topic.isCompleted && (
                  <span
                    className="h-3 w-3 rounded-full bg-jungle-green shadow-sm"
                    aria-hidden="true"
                  />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
