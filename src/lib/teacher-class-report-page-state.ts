import type { TeacherClassReportPayload } from "./teacher-reports.ts";

export type TeacherClassReportPageState =
  | {
      kind: "ready";
      title: string;
      subtitle: string;
      report: TeacherClassReportPayload;
    }
  | {
      kind: "error";
      title: string;
      subtitle: string;
      message: string;
    }
  | {
      kind: "empty";
      title: string;
      subtitle: string;
      message: string;
    };

const FALLBACK_TITLE = "Class report";
const FALLBACK_SUBTITLE = "Choose another class or try a different report window.";

export function buildTeacherClassReportPageState(input: {
  data: TeacherClassReportPayload | null | undefined;
  error: unknown;
}): TeacherClassReportPageState {
  if (input.data) {
    return {
      kind: "ready",
      title: input.data.classSummary.name,
      subtitle: `Code: ${input.data.classSummary.joinCode} | ${input.data.windowLabel}`,
      report: input.data,
    };
  }

  if (input.error) {
    return {
      kind: "error",
      title: FALLBACK_TITLE,
      subtitle: FALLBACK_SUBTITLE,
      message:
        input.error instanceof Error && input.error.message
          ? input.error.message
          : "We couldn't load this class report right now.",
    };
  }

  return {
    kind: "empty",
    title: FALLBACK_TITLE,
    subtitle: FALLBACK_SUBTITLE,
    message: "Class report unavailable.",
  };
}
