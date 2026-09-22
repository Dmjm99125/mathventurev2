import { useLanguage } from "@/lib/i18n/useLanguage";
import { Backpack, BookOpen, CheckCircle2, Compass, GraduationCap, Users } from "lucide-react";

export function StudentPortalLoading() {
  const { t } = useLanguage();

  return (
    <div role="status" aria-live="polite" className="student-loading relative isolate min-h-[420px] overflow-hidden rounded-[32px] border-4 p-6 sm:p-10">
      <div className="student-loading__background absolute inset-0 -z-10" />
      <div className="student-loading__ring absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full" />
      <div className="student-loading__glow absolute -bottom-24 -left-10 -z-10 h-56 w-56 rounded-full" />

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="student-loading__brand mb-7 flex items-center gap-3">
          <Compass className="h-7 w-7 animate-[spin_5s_linear_infinite] motion-reduce:animate-none" />
          <span className="text-xs font-black uppercase tracking-[0.28em]">Mathventure</span>
        </div>

        <div className="student-loading__badge relative mb-7 flex h-28 w-28 items-center justify-center rounded-[2rem] border-4">
          <Backpack className="h-16 w-16" strokeWidth={1.8} />
          <span className="student-loading__badge-mark absolute -right-3 -top-3 flex h-10 w-10 animate-bounce items-center justify-center rounded-full shadow-lg motion-reduce:animate-none">
            <GraduationCap className="h-5 w-5" />
          </span>
        </div>

        <h1 className="student-loading__title text-3xl font-black tracking-tight sm:text-4xl">{t("student.portal.loadingTitle")}</h1>
        <p className="student-loading__body mt-3 max-w-md text-base font-semibold leading-relaxed">{t("student.portal.loadingBody")}</p>

        <div className="student-loading__progress mt-10 w-full max-w-xl">
          <div className="student-loading__track relative h-3 overflow-hidden rounded-full">
            <div className="student-loading__fill absolute inset-y-0 left-0 w-2/3 rounded-full" />
            <div className="student-loading__shimmer absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full blur-sm motion-reduce:animate-none" />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-left">
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
    <div className="student-loading__step flex items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold backdrop-blur-sm">
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}
