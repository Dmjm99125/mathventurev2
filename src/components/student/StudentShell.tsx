import type { ReactNode } from "react";
import { BookOpen, Users } from "lucide-react";
import { Link } from "wouter";

import { useLanguage } from "@/lib/i18n/useLanguage";
import { STUDENT_NAV_ITEMS } from "@/lib/student/navigation";
import { cn } from "@/lib/shared/utils";

type StudentShellProps = {
  children: ReactNode;
  current: "lessons" | "classroom";
};

export function StudentShell({ children, current }: StudentShellProps) {
  const { t } = useLanguage();

  return (
    <div className="student-shell min-h-[100dvh]">
      <div className="student-shell__grain" aria-hidden="true" />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <nav className="student-shell__nav" aria-label="Student navigation">
          {STUDENT_NAV_ITEMS.map((item) => {
            const active = item.href === "/student"
              ? current === "lessons"
              : current === "classroom";
            const Icon = item.href === "/student" ? BookOpen : Users;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("student-shell__nav-link", active && "is-active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="student-shell__content">{children}</div>
      </div>
    </div>
  );
}
