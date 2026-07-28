import React from "react";

import { useLanguage } from "@/lib/useLanguage";

export function StudentPortalLoading() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden rounded-[32px] border-4 border-white/60 bg-[linear-gradient(180deg,#88d6ff_0%,#d8f3ff_62%,#d5ec95_62%,#b3d66b_100%)] p-8 text-center shadow-[0_24px_60px_rgba(34,94,49,0.16)]">
      <div className="mx-auto mb-4 h-20 w-20 animate-bounce rounded-full bg-white/80 shadow-sm" />
      <h1 className="text-3xl font-extrabold text-primary">{t("student.portal.loadingTitle")}</h1>
      <p className="mt-2 text-base font-bold text-primary/80">{t("student.portal.loadingBody")}</p>
    </div>
  );
}
