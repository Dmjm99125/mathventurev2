import React from 'react';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';

export function TeacherWorkspaceBoard({
  heading,
  action,
  children,
}: {
  heading: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-[calc(100dvh-4rem)] overflow-x-hidden lg:pl-[280px]">
      <div className="min-h-[calc(100dvh-4rem)] overflow-hidden border-y-2 border-border bg-card shadow-[0_24px_70px_rgba(58,88,42,0.12)] sm:rounded-[32px] sm:border-2">
        <div className="min-h-[calc(100dvh-4rem)]">
          <TeacherSidebar />

          <section className="min-w-0 p-4 sm:p-5 md:p-6 lg:p-8">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">{heading}</div>
              {action ? <div className="w-full md:w-auto md:shrink-0">{action}</div> : null}
            </div>
            <div className="mt-6 min-w-0 sm:mt-8">{children}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
