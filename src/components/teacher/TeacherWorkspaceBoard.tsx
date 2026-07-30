import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from '@/lib/teacher/navigation';
import { signOut } from '@/lib/auth';
import { cn } from '@/lib/shared/utils';

export function TeacherWorkspaceBoard({
  heading,
  action,
  children,
}: {
  heading: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();

  return (
    <div className="w-full min-h-[calc(100dvh-4rem)]">
      <div className="min-h-[calc(100dvh-4rem)] overflow-hidden border-y-2 border-border bg-card shadow-[0_24px_70px_rgba(58,88,42,0.12)] sm:rounded-[32px] sm:border-2">
        <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col border-b-2 border-border bg-[linear-gradient(180deg,#f4f7e9_0%,#eef5dc_100%)] p-5 sm:p-6 lg:border-b-0 lg:border-r-2">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-border bg-white text-3xl font-display font-bold text-primary">
              {user?.full_name?.trim().slice(0, 1).toUpperCase() ?? 'T'}
            </div>
            <p className="mt-4 text-lg font-display font-bold text-foreground">
              Welcome, {user?.full_name ?? 'Teacher'}
            </p>

            <nav className="mt-8 grid gap-2">
              {TEACHER_NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 font-bold transition-colors',
                      isTeacherNavActive(location, item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent',
                    )}
                  >
                    {t(item.labelKey)}
                  </div>
                </Link>
              ))}
            </nav>

            <div className="mt-8 border-t-2 border-border pt-6 lg:mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={async () => {
                  await signOut();
                  setLocation('/');
                }}
              >
                {t('common.logout')}
              </Button>
            </div>
          </aside>

          <section className="p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">{heading}</div>
              {action ? <div className="md:shrink-0">{action}</div> : null}
            </div>
            <div className="mt-8">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
