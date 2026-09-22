import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui';
import { useAuth, signOut } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from '@/lib/teacher/navigation';
import { cn } from '@/lib/shared/utils';
import { Menu, X } from 'lucide-react';

function TeacherNavLinks({
  location,
  onNavigate,
}: {
  location: string;
  onNavigate?(): void;
}) {
  const { t } = useLanguage();

  return (
    <>
      {TEACHER_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span
            className={cn(
              'block rounded-xl px-4 py-3 font-bold transition-colors',
              isTeacherNavActive(location, item.href)
                ? 'bg-[var(--teacher-moss)] text-[var(--teacher-sand)]'
                : 'text-[var(--teacher-ink)] hover:bg-[var(--teacher-sage)]/30',
            )}
          >
            {t(item.labelKey)}
          </span>
        </Link>
      ))}
    </>
  );
}

export function TeacherSidebar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--teacher-moss)]/30 bg-[var(--teacher-oat)] text-xl font-display font-bold text-[var(--teacher-moss)]">
        {user?.full_name?.trim().slice(0, 1).toUpperCase() ?? 'T'}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--teacher-moss)]/70">Teacher</p>
        <p className="truncate font-display text-lg font-bold text-[var(--teacher-ink)]">
          {user?.full_name ?? 'Teacher'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-[280px] flex-col border-r border-[var(--teacher-moss)]/20 bg-[var(--teacher-sand)] p-6 lg:flex">
        {identity}
        <nav aria-label="Teacher navigation" className="mt-10 grid gap-2">
          <TeacherNavLinks location={location} />
        </nav>
        <div className="mt-auto border-t border-[var(--teacher-moss)]/20 pt-5">
          <Button
            variant="ghost"
            className="w-full justify-start px-4 text-[var(--teacher-ink)] hover:bg-[var(--teacher-sage)]/30"
            onClick={handleSignOut}
          >
            {t('common.logout')}
          </Button>
        </div>
      </aside>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="fixed right-4 top-[4.75rem] z-40 border-[var(--teacher-moss)]/30 bg-[var(--teacher-sand)] text-[var(--teacher-ink)] lg:hidden"
        aria-expanded={mobileOpen}
        aria-controls="teacher-mobile-nav"
        aria-label={mobileOpen ? 'Close teacher navigation' : 'Open teacher navigation'}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[var(--teacher-ink)]/35"
            aria-label="Close teacher navigation"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            id="teacher-mobile-nav"
            className="relative flex h-full w-[min(88vw,22rem)] flex-col border-r border-[var(--teacher-moss)]/20 bg-[var(--teacher-sand)] p-5 shadow-xl"
          >
            <div className="flex items-center justify-between gap-4">
              {identity}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close teacher navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </Button>
            </div>
            <nav aria-label="Teacher navigation" className="mt-8 grid gap-2">
              <TeacherNavLinks location={location} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="mt-auto border-t border-[var(--teacher-moss)]/20 pt-5">
              <Button
                variant="ghost"
                className="w-full justify-start px-4 text-[var(--teacher-ink)]"
                onClick={handleSignOut}
              >
                {t('common.logout')}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
