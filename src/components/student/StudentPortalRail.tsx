import React from "react";

import { Button, Card, Input } from "@/components/ui";
import type { StudentClassSummary } from "@/lib/api";
import type { PortalRailSummary } from "@/lib/student-portal";
import { useLanguage } from "@/lib/useLanguage";

export function StudentPortalRail({
  summary,
  classes,
  joinCode,
  isJoining,
  isJoinPending,
  onJoinCodeChange,
  onJoinSubmit,
  onStartJoin,
  onOpenAssignment,
  onOpenClass,
}: {
  summary: PortalRailSummary;
  classes: StudentClassSummary[];
  joinCode: string;
  isJoining: boolean;
  isJoinPending: boolean;
  onJoinCodeChange: (value: string) => void;
  onJoinSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onStartJoin: () => void;
  onOpenAssignment: (href: string) => void;
  onOpenClass: (classId: string) => void;
}) {
  const { t } = useLanguage();
  const primaryClass = summary.primaryClass;

  return (
    <aside className="flex flex-col gap-4">
      <Card className="rounded-[28px] border-white/70 bg-[#fff7db]/95 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.12)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-jungle-orange">
          {t("student.portal.nextAssignment")}
        </p>
        {summary.nextAction.kind === "assignment" ? (
          <>
            <h2 className="mt-2 text-2xl font-extrabold capitalize text-primary">
              {summary.nextAction.lessonId}
            </h2>
            <p className="mt-1 text-sm font-bold text-primary/75">{t("student.portal.playThisNext")}</p>
            <Button className="mt-4 w-full" variant="jungle" onClick={() => onOpenAssignment(summary.nextAction.href)}>
              {t("student.playNow")}
            </Button>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-2xl font-extrabold text-primary">{t("student.portal.noAssignmentsTitle")}</h2>
            <p className="mt-1 text-sm font-bold text-primary/75">{t("student.portal.noAssignmentsBody")}</p>
            <Button className="mt-4 w-full" onClick={() => onOpenAssignment(summary.nextAction.href)}>
              {t("student.portal.tapAnyLesson")}
            </Button>
          </>
        )}
      </Card>

      <Card className="rounded-[28px] bg-white/92 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.1)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          {t("student.portal.myClass")}
        </p>
        {primaryClass ? (
          <>
            <button
              type="button"
              className="mt-3 w-full rounded-2xl bg-muted/50 px-4 py-3 text-left"
              onClick={() => onOpenClass(primaryClass.id)}
            >
              <span className="block text-lg font-extrabold text-foreground">{primaryClass.name}</span>
              <span className="block text-sm font-bold text-muted-foreground">{primaryClass.teacherName}</span>
            </button>
            {classes.length > 1 && (
              <p className="mt-3 text-xs font-bold text-muted-foreground">
                +{classes.length - 1} more class{classes.length > 2 ? "es" : ""}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-bold text-muted-foreground">{t("student.portal.noClasses")}</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">{t("student.portal.joinPrompt")}</p>
          </>
        )}

        {isJoining ? (
          <form onSubmit={onJoinSubmit} className="mt-4 grid gap-2">
            <Input
              value={joinCode}
              onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase())}
              className="font-mono uppercase"
              placeholder={t("teacher.joinCode")}
              autoFocus
            />
            <Button type="submit" variant="outline" disabled={isJoinPending || !joinCode.trim()}>
              Join
            </Button>
          </form>
        ) : (
          <Button className="mt-4 w-full" variant="outline" onClick={onStartJoin}>
            {t("student.portal.joinClass")}
          </Button>
        )}
      </Card>

      <Card className="rounded-[28px] bg-white/92 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.1)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
          {t("student.portal.myProgress")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-jungle-yellow/20 px-3 py-4 text-center">
            <span className="block text-2xl font-extrabold text-primary">{summary.streakDays}</span>
            <span className="text-xs font-bold text-muted-foreground">{t("student.portal.days")}</span>
          </div>
          <div className="rounded-2xl bg-primary/10 px-3 py-4 text-center">
            <span className="block text-2xl font-extrabold text-primary">{summary.completedLessons}</span>
            <span className="text-xs font-bold text-muted-foreground">{t("student.portal.done")}</span>
          </div>
          <div className="rounded-2xl bg-sky-100 px-3 py-4 text-center">
            <span className="block text-2xl font-extrabold text-primary">{summary.recentScorePct ?? "--"}</span>
            <span className="text-xs font-bold text-muted-foreground">{t("student.portal.score")}</span>
          </div>
        </div>
      </Card>
    </aside>
  );
}
