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
    <div className="teacher-shell teacher-grain min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[var(--teacher-sand)] lg:pl-[280px]">
      <TeacherSidebar />
      <main className="teacher-learning-trail min-h-[calc(100dvh-4rem)] min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex min-w-0 flex-col gap-5 border-b border-[var(--teacher-moss)]/20 pb-8 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">{heading}</div>
            {action ? <div className="w-full md:w-auto md:shrink-0">{action}</div> : null}
          </div>
          <div className="min-w-0 pt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
