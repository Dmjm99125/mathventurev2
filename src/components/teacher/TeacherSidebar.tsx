import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui';
import { useAuth, signOut } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { TEACHER_NAV_ITEMS, isTeacherNavActive } from '@/lib/teacher/navigation';
import { cn } from '@/lib/shared/utils';

export function TeacherSidebar() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [location, setLocation] = useLocation();

  return (
    <aside className="hidden min-w-0 flex-col border-b-2 border-border bg-[linear-gradient(180deg,#f4f7e9_0%,#eef5dc_100%)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5 md:flex lg:fixed lg:bottom-0 lg:left-0 lg:top-16 lg:z-30 lg:h-[calc(100dvh-4rem)] lg:w-[280px] lg:overflow-y-auto lg:flex-col lg:flex-nowrap lg:items-stretch lg:border-b-0 lg:border-r-2 lg:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center lg:block lg:flex-none">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-white text-2xl font-display font-bold text-primary sm:h-16 sm:w-16 lg:h-24 lg:w-24 lg:rounded-[28px] lg:text-3xl">
          {user?.full_name?.trim().slice(0, 1).toUpperCase() ?? 'T'}
        </div>
        <p className="text-base font-display font-bold text-foreground sm:text-lg lg:mt-4">
          Welcome, {user?.full_name ?? 'Teacher'}
        </p>
      </div>

      <nav aria-label="Teacher navigation" className="mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1 sm:mt-0 sm:flex-1 lg:mt-8 lg:flex-none lg:grid lg:max-w-none lg:overflow-visible">
        {TEACHER_NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
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

      <div className="mt-4 border-t-2 border-border pt-4 sm:ml-auto sm:mt-0 sm:border-l-2 sm:border-t-0 sm:pl-4 lg:ml-0 lg:mt-8 lg:border-l-0 lg:border-t-2 lg:pl-0 lg:pt-6">
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
  );
}
