import { useLanguage } from "@/lib/i18n/useLanguage";
import { Backpack, BookOpen, CheckCircle2, Compass, GraduationCap, Users } from "lucide-react";

export function StudentPortalLoading() {
  const { t } = useLanguage();

  return (
    <div role="status" aria-live="polite" className="relative isolate min-h-[420px] overflow-hidden rounded-[32px] border-4 border-white/70 bg-[#103d32] p-6 text-white shadow-[0_24px_60px_rgba(34,94,49,0.2)] sm:p-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(255,215,94,0.28),transparent_24%),radial-gradient(circle_at_85%_20%,rgba(84,204,189,0.26),transparent_30%),linear-gradient(160deg,#155b48_0%,#103d32_58%,#092a28_100%)]" />
      <div className="absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full border-[28px] border-[#f7c948]/15" />
      <div className="absolute -bottom-24 -left-10 -z-10 h-56 w-56 rounded-full bg-[#6ba84a]/20 blur-2xl" />

      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-7 flex items-center gap-3 text-[#f7c948]">
          <Compass className="h-7 w-7 animate-[spin_5s_linear_infinite] motion-reduce:animate-none" />
          <span className="text-xs font-black uppercase tracking-[0.28em]">Mathventure</span>
        </div>

        <div className="relative mb-7 flex h-28 w-28 items-center justify-center rounded-[2rem] border-4 border-[#f7c948]/70 bg-[#f7c948] text-[#103d32] shadow-[0_12px_0_#c89427]">
          <Backpack className="h-16 w-16" strokeWidth={1.8} />
          <span className="absolute -right-3 -top-3 flex h-10 w-10 animate-bounce items-center justify-center rounded-full bg-[#ef6a5b] text-white shadow-lg motion-reduce:animate-none">
            <GraduationCap className="h-5 w-5" />
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-[#fff7db] sm:text-4xl">{t("student.portal.loadingTitle")}</h1>
        <p className="mt-3 max-w-md text-base font-semibold leading-relaxed text-[#d5eee0]">{t("student.portal.loadingBody")}</p>

        <div className="mt-10 w-full max-w-xl">
          <div className="relative h-3 overflow-hidden rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 w-2/3 rounded-full bg-[linear-gradient(90deg,#f7c948,#74d49b)]" />
            <div className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-white/50 blur-sm motion-reduce:animate-none" />
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
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-bold text-[#d5eee0] backdrop-blur-sm">
      <Icon className="h-4 w-4 shrink-0 text-[#f7c948]" />
      <span>{label}</span>
    </div>
  );
}
