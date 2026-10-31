import { useLocation } from 'wouter';
import { useStudentDashboard } from '@features/dashboard/api/hooks';
import { useAssignments } from '@features/assignments/api/hooks';
import { useStudentClassroom } from '@features/classroom/api/hooks';
import { Card, Button } from '@/components/ui';
import type { AssignmentForStudent, StudentClassroomSummary } from '@/lib/api';
import { LegacyLessonMenu } from '@/components/student/LegacyLessonMenu';
import { StudentPortalLoading } from '@/components/student/StudentPortalLoading';
import { StudentPortalRail } from '@/components/student/StudentPortalRail';
import { StudentShell } from '@/components/student/StudentShell';
import { buildPortalTopicEntries, summarizePortalRail } from '@features/student/model/portal';
import { mapStudentAssignments, mapStudentClassroom, mapStudentDashboard } from '@features/student/model/dto';
import { useLanguage } from '@features/i18n/context';
import { useAuth } from '@/lib/auth';

export function StudentDashboard() {
  const { isLoading: authLoading } = useAuth();
  const { data: dashboard, isLoading: dashLoading, error: dashboardError } = useStudentDashboard();
  const { data: assignmentsData, isLoading: assignLoading, error: assignmentsError } = useAssignments();
  const { data: classroomData, isLoading: classLoading, error: classesError } = useStudentClassroom();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  if (authLoading || dashLoading || assignLoading || classLoading) {
    return <StudentPortalLoading />;
  }

  const assignments = (assignmentsData?.pages.flatMap((page) => page.assignments) || []) as AssignmentForStudent[];
  const classroom = (classroomData?.classroom ?? null) as StudentClassroomSummary | null;
  const portalAssignments = mapStudentAssignments(assignments);
  const portalClassroom = mapStudentClassroom(classroom);
  const dashboardSummary = mapStudentDashboard(dashboard ?? null);
  const showDashboardNotice = Boolean(dashboardError || assignmentsError || classesError || !dashboard);
  const topics = buildPortalTopicEntries({
    assignments: portalAssignments,
    classes: portalClassroom ? [portalClassroom] : [],
    recentAttempts: dashboardSummary.recentAttempts,
  });
  const railSummary = summarizePortalRail({
    assignments: portalAssignments,
    classroom: portalClassroom,
    dashboard: dashboardSummary,
  });
  const highlightedLessonId =
    railSummary.nextAction.kind === 'assignment' ? railSummary.nextAction.lessonId : null;

  return (
    <StudentShell current="lessons">
      <div className="animate-in fade-in duration-500">
      {showDashboardNotice && (
        <Card className="mb-4 rounded-[28px] border-white/70 bg-[#fff7db]/95 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.12)]">
          <h2 className="text-xl font-extrabold text-primary">{t('student.portal.dashboardUnavailableTitle')}</h2>
          <p className="mt-2 text-sm font-bold text-primary/75">{t('student.portal.dashboardUnavailableBody')}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="jungle" onClick={() => window.location.reload()}>
              {t('common.tryAgain')}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(260px,25%)_minmax(0,1fr)]">
        <StudentPortalRail
          summary={railSummary}
          classroom={classroom}
          onOpenAssignment={(href) => setLocation(href)}
          onOpenClassroom={() => setLocation('/student/classroom')}
        />

        <div className="relative overflow-hidden rounded-[32px] border-4 border-[color:var(--student-moss)]/30 shadow-[0_20px_0_color-mix(in_srgb,var(--student-clay)_42%,transparent)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(124,214,255,0.88) 0%, rgba(215,245,255,0.7) 65%, rgba(190,220,107,0.28) 100%), url('/assets/images/1bg.jpg')",
            }}
          />
          <div className="absolute -left-12 top-0 h-[68%] w-44 rounded-br-[140px] rounded-tr-[140px] bg-jungle-green/80 blur-sm" />
          <div className="absolute bottom-0 left-0 h-36 w-full bg-[radial-gradient(circle_at_20%_10%,rgba(211,239,126,0.75),transparent_35%),linear-gradient(180deg,rgba(150,193,74,0)_0%,rgba(108,150,54,0.58)_100%)]" />
          <div className="relative p-3 md:p-5">
            <LegacyLessonMenu
              topics={topics}
              highlightedLessonId={highlightedLessonId}
              onSelect={(href) => setLocation(href)}
            />
          </div>
        </div>
      </div>
      </div>
    </StudentShell>
  );
}
