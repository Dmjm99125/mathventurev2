import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button, Card } from '@/components/ui';
import { TeacherReportsAttentionList } from '@/components/teacher/reports/TeacherReportsAttentionList';
import { TeacherClassReportPdfButton } from '@/components/teacher/reports/TeacherClassReportPdfButton';
import { TeacherClassReportStudentTable } from '@/components/teacher/reports/TeacherClassReportStudentTable';
import { TeacherClassReportTopicBreakdown } from '@/components/teacher/reports/TeacherClassReportTopicBreakdown';
import { TeacherReportsClassroomSummary } from '@/components/teacher/reports/TeacherReportsClassroomSummary';
import { TeacherReportsRecentActivity } from '@/components/teacher/reports/TeacherReportsRecentActivity';
import { TeacherReportsWindowPicker } from '@/components/teacher/reports/TeacherReportsWindowPicker';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { useTeacherReportsOverview } from '@features/reports/api/hooks';
import { parseTeacherReportsWindow } from '@/lib/teacher/reports';
import { teacherClassPath } from '@features/teacher/model/classes';

function teacherPageHeading(title: string, description: string) {
  return (
    <>
      <p className="teacher-eyebrow">MathVenture teacher workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">{description}</p>
    </>
  );
}

export function TeacherReportsPage({ classId }: { classId: string }) {
  const [location, setLocation] = useLocation();
  const [studentCursor, setStudentCursor] = useState<string | null>(null);
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  React.useEffect(() => {
    setStudentCursor(null);
  }, [windowKey]);
  const { data, isLoading, error } = useTeacherReportsOverview(classId, windowKey, studentCursor);

  if (isLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading reports...</div>;
  }

  return (
    <TeacherWorkspaceBoard
      classId={classId}
      heading={teacherPageHeading('Reports', 'Review classroom performance, student activity, and topic mastery in one place.')}
      action={data ? (
        <div className="w-full md:w-auto [&_button]:w-full md:[&_button]:w-auto">
          <TeacherClassReportPdfButton report={data} disabled={!data.hasData} />
        </div>
      ) : undefined}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`${teacherClassPath(classId, 'reports')}?window=${nextWindow}`)}
      />

      {error && (
        <Card className="teacher-section mb-6 border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-6 font-semibold text-[var(--teacher-ink)]">
          {(error as Error).message || "We couldn't load reports right now."}
        </Card>
      )}

      {data && (
        <div className="grid gap-10">
          <TeacherReportsClassroomSummary summary={data.classroomSummary} />
          {data.hasData ? null : (
            <Card className="teacher-section border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 font-semibold text-[var(--teacher-ink)]">
              No reportable game results exist for this classroom in the selected window.
            </Card>
          )}
          <TeacherReportsAttentionList rows={data.attentionStudents} />
          <TeacherReportsRecentActivity data={data.recentActivity} />
          <TeacherClassReportStudentTable rows={data.studentRows} />
          <TeacherClassReportTopicBreakdown rows={data.topicBreakdown} />
          {(studentCursor || data.studentRowsPage.hasMore) && (
            <div className="flex justify-center gap-3">
              {studentCursor && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
                  onClick={() => setStudentCursor(null)}
                >
                  Previous students
                </Button>
              )}
              {data.studentRowsPage.hasMore && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
                  onClick={() => setStudentCursor(data.studentRowsPage.nextCursor)}
                  disabled={!data.studentRowsPage.nextCursor}
                >
                  Next students
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}
