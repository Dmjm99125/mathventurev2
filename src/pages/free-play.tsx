import { useLocation } from 'wouter';
import { Gamepad2, Sparkles } from 'lucide-react';
import { TopNav } from '@/components/layout';
import { LegacyLessonMenu } from '@/components/student/LegacyLessonMenu';
import { Button, Card } from '@/components/ui';
import { LEGACY_TOPIC_META, type PortalTopicEntry } from '@/lib/student/portal';

const FREE_PLAY_TOPICS: PortalTopicEntry[] = LEGACY_TOPIC_META.map((topic) => ({
  ...topic,
  href: `/student/lessons/${topic.id}?freePlay=1`,
  isAssigned: false,
  isCompleted: false,
  recentScorePct: null,
}));

export function FreePlay() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-[100dvh] bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(124,214,255,0.88) 0%, rgba(215,245,255,0.7) 65%, rgba(190,220,107,0.28) 100%), url('/assets/images/1bg.jpg')",
      }}
    >
      <TopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-8 md:py-12">
        <Card className="w-full max-w-3xl rounded-[28px] border-4 border-white/70 bg-white/90 p-6 text-center shadow-[0_24px_60px_rgba(34,94,49,0.16)] md:p-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-jungle-orange text-white shadow-lg">
            <Gamepad2 className="h-9 w-9" />
          </div>
          <h1 className="text-4xl font-display font-extrabold text-foreground md:text-5xl">Free Play</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg font-bold text-muted-foreground">
            Choose any adventure and practice at your own pace. No login is needed.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-extrabold text-primary">
            <Sparkles className="h-4 w-4" /> Explore every topic
          </div>
        </Card>

        <div className="w-full max-w-3xl rounded-[32px] border-4 border-white/60 bg-white/10 p-2 shadow-[0_24px_60px_rgba(34,94,49,0.16)] md:p-4">
          <LegacyLessonMenu
            topics={FREE_PLAY_TOPICS}
            highlightedLessonId={null}
            onSelect={(href) => setLocation(href)}
          />
        </div>

        <Button variant="outline" className="bg-white/90" onClick={() => setLocation('/')}>
          Back to home
        </Button>
      </main>
    </div>
  );
}
