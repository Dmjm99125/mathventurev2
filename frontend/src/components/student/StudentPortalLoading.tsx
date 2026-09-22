import { useLanguage } from "@/lib/i18n/useLanguage";
import { BookOpen, CheckCircle2, Compass, Users } from "lucide-react";

export function StudentPortalLoading() {
  const { t } = useLanguage();

  return (
    <div role="status" aria-live="polite" className="student-loading-screen">
      <div className="student-loading-card">
        <div className="student-loading__badge" aria-hidden="true">
          <Compass className="h-10 w-10" strokeWidth={2.2} />
        </div>

        <h1 className="student-loading__title">{t("student.portal.loadingTitle")}</h1>
        <p className="student-loading__body">{t("student.portal.loadingBody")}</p>

        <div className="student-loading__progress" aria-hidden="true">
          <div className="student-loading__track">
            <div className="student-loading__fill" />
          </div>
          <div className="student-loading__steps">
            <LoadingStep icon={BookOpen} label="Lessons" />
            <LoadingStep icon={CheckCircle2} label="Assignments" />
            <LoadingStep icon={Users} label="Classroom" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <div className="student-loading__step">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
