import React from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';
import { useLanguage } from '@features/i18n/context';

export function TeacherWorkspaceBoard({
  heading,
  action,
  children,
  classId,
  readOnly = false,
}: {
  heading: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  classId?: string;
  readOnly?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <div className="teacher-shell teacher-grain min-h-[calc(100dvh-4rem)] overflow-x-hidden bg-[var(--teacher-sand)] lg:pl-[280px]">
      <TeacherSidebar classId={classId} />
      <main className="teacher-learning-trail min-h-[calc(100dvh-4rem)] min-w-0 px-4 py-8 sm:px-6 md:px-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-[1280px]">
          {classId ? (
            <div className="mb-6">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[var(--teacher-moss)]/30 bg-[var(--teacher-sand)] font-bold text-[var(--teacher-ink)] shadow-xs hover:bg-[var(--teacher-oat)]/40"
              >
                <Link href="/teacher">
                  <ArrowLeft className="mr-1.5 h-4 w-4 shrink-0 text-[var(--teacher-moss)]" />
                  {t('teacher.returnToClasses')}
                </Link>
              </Button>
            </div>
          ) : null}

          {/* Page header */}
          <div className="flex min-w-0 flex-col gap-5 border-b border-[var(--teacher-moss)]/20 pb-8 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">{heading}</div>
            {action ? (
              <div className="w-full md:w-auto md:shrink-0">{action}</div>
            ) : null}
          </div>

          {/* Archived class banner */}
          {readOnly && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[var(--teacher-terracotta)]/30 bg-[var(--teacher-terracotta)]/8 px-5 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--teacher-terracotta)]" />
              <p className="font-semibold text-[var(--teacher-ink)]">
                This class is archived. Roster and reports remain available, while class changes are disabled.
              </p>
            </div>
          )}

          <div className="min-w-0 pt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
