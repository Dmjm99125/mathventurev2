import { Button } from '@/components/ui';
import { downloadTeacherClassReportPdf } from '@/lib/teacher/reports/pdf';
import type { TeacherSingleClassroomReportPayload } from '@/lib/teacher/reports';

export function TeacherClassReportPdfButton({
  report,
  disabled,
}: {
  report: TeacherSingleClassroomReportPayload;
  disabled: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
      disabled={disabled}
      onClick={() => downloadTeacherClassReportPdf(report)}
    >
      Export PDF
    </Button>
  );
}
