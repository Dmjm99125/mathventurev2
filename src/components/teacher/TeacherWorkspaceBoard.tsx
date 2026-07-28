import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/useAuth';
import { useLanguage } from '@/lib/useLanguage';
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from '@/lib/teacher-nav';
import { signOut } from '@/lib/auth';
import { cn } from '@/lib/utils';

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
    <div className="mx-auto max-w-[1400px]">
      <div className="overflow-hidden rounded-[32px] border-2 border-border bg-card shadow-[0_24px_70px_rgba(58,88,42,0.12)]">
        <div className="grid min-h-[720px] lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="border-b-2 border-border bg-[linear-gradient(180deg,#f4f7e9_0%,#eef5dc_100%)] p-6 lg:border-b-0 lg:border-r-2">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-border bg-white text-3xl font-display font-bold text-primary">
              {user?.full_name?.trim().slice(0, 1).toUpperCase() ?? 'T'}
            </div>
            <p className="mt-4 text-lg font-display font-bold text-foreground">
              Welcome, {user?.full_name ?? 'Teacher'}
            </p>

            <nav className="mt-8 space-y-2">
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

            <div className="mt-10 border-t-2 border-border pt-6">
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

          <section className="p-5 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>{heading}</div>
              {action}
            </div>
            <div className="mt-8">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
