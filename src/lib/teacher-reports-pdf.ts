import type { TeacherClassReportPayload } from "./teacher-reports.ts";

export type TeacherClassReportPdfModel = {
  filename: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  studentRows: string[][];
  topicRows: string[][];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatPct(value: number | null): string {
  return value == null ? "--" : `${value}%`;
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "--";
}

export function buildTeacherClassReportPdfModel(
  report: TeacherClassReportPayload,
): TeacherClassReportPdfModel {
  return {
    filename: `${slugify(report.classSummary.name)}-${slugify(report.windowLabel)}-report.pdf`,
    title: `${report.classSummary.name} Report`,
    subtitle: `${report.windowLabel} | Code ${report.classSummary.joinCode}`,
    generatedAt: new Date().toISOString().slice(0, 10),
    studentRows: report.studentRows.map((row) => [
      row.lastName ?? "--",
      row.firstName,
      formatPct(row.averageScorePct),
      formatPct(row.completionPct),
      formatPct(row.lastPlayedPct),
      formatDate(row.lastActivityAt),
    ]),
    topicRows: report.topicBreakdown.map((row) => [
      row.topicId,
      formatPct(row.averageScorePct),
      String(row.passCount),
      String(row.attemptCount),
    ]),
  };
}

export async function downloadTeacherClassReportPdf(
  report: TeacherClassReportPayload,
): Promise<void> {
  const model = buildTeacherClassReportPdfModel(report);
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  pdf.setFontSize(18);
  pdf.text(model.title, 40, 48);
  pdf.setFontSize(11);
  pdf.text(model.subtitle, 40, 68);
  pdf.text(`Generated ${model.generatedAt}`, 40, 84);

  autoTable(pdf, {
    startY: 108,
    head: [["Last Name", "First Name", "Avg Score", "Completion", "Last Played", "Last Activity"]],
    body: model.studentRows,
  });

  const previousTable = pdf as typeof pdf & { lastAutoTable?: { finalY: number } };
  autoTable(pdf, {
    startY: previousTable.lastAutoTable?.finalY
      ? previousTable.lastAutoTable.finalY + 24
      : 320,
    head: [["Topic", "Avg Score", "Passes", "Attempts"]],
    body: model.topicRows,
  });

  pdf.save(model.filename);
}
