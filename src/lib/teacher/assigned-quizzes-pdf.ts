import { GAME_CATALOG } from '@/lib/games/catalog';
import { getTeacherAssignedQuizName, type TeacherAssignedQuiz } from '@/lib/teacher/assigned-quizzes';

export type TeacherAssignedQuizPdfStudentSection = {
  studentName: string;
  status: string;
  overallScore: string;
  gameRows: string[][];
};

export type TeacherAssignedQuizPdfModel = {
  filename: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  assignedAt: string;
  dueAt: string;
  summaryRows: string[][];
  studentSections: TeacherAssignedQuizPdfStudentSection[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatScore(score: number | null, maxScore: number | null, scorePct: number | null): string {
  return score == null || maxScore == null || scorePct == null
    ? '--'
    : `${score} / ${maxScore} (${scorePct}%)`;
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : '--';
}

function formatStatus(status: TeacherAssignedQuiz['students'][number]['status']): string {
  return status === 'not_started' ? 'Not started' : status === 'in_progress' ? 'In progress' : 'Completed';
}

function formatStudentName(student: TeacherAssignedQuiz['students'][number]): string {
  return [student.lastName, student.firstName].filter(Boolean).join(', ') || student.fullName;
}

export function buildTeacherAssignedQuizPdfModel(
  quiz: TeacherAssignedQuiz,
  generatedAt = new Date().toISOString(),
): TeacherAssignedQuizPdfModel {
  const { assignment, students } = quiz;
  const quizName = getTeacherAssignedQuizName(assignment);
  const games = GAME_CATALOG.filter((game) => game.topicId === assignment.lessonId);

  return {
    filename: `quiz-${slugify(quizName)}-results.pdf`,
    title: quizName,
    subtitle: `Quiz results | ${assignment.lessonId} | ${students.length} student${students.length === 1 ? '' : 's'}`,
    generatedAt: formatDate(generatedAt),
    assignedAt: formatDate(assignment.createdAt),
    dueAt: formatDate(assignment.dueAt),
    summaryRows: students.map((student) => [
      student.lastName ?? '--',
      student.firstName,
      formatScore(student.overallScore, student.overallMaxScore, student.overallScorePct),
      formatStatus(student.status),
    ]),
    studentSections: students.map((student) => {
      const scoreByGameId = new Map(student.gameScores.map((game) => [game.gameId, game]));

      return {
        studentName: formatStudentName(student),
        status: formatStatus(student.status),
        overallScore: formatScore(student.overallScore, student.overallMaxScore, student.overallScorePct),
        gameRows: games.map((game) => {
          const result = scoreByGameId.get(game.gameId);

          return [
            String(game.gameOrder + 1),
            game.title,
            formatScore(result?.score ?? null, result?.maxScore ?? null, result?.scorePct ?? null),
            formatDate(result?.completedAt ?? null),
          ];
        }),
      };
    }),
  };
}

export async function downloadTeacherAssignedQuizPdf(quiz: TeacherAssignedQuiz): Promise<void> {
  const model = buildTeacherAssignedQuizPdfModel(quiz);
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 40;

  const drawHeader = (heading: string, detail: string) => {
    pdf.setFillColor(22, 101, 52);
    pdf.rect(0, 0, pageWidth, 84, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text(heading, margin, 34);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(detail, margin, 54);
    pdf.text('Generated ' + model.generatedAt, pageWidth - margin, 54, { align: 'right' });
    pdf.setTextColor(31, 41, 55);
  };

  const drawFooter = (page: number) => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text('MathVenture teacher export', margin, pageHeight - 20);
    pdf.text(`Page ${page}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
    pdf.setTextColor(31, 41, 55);
  };

  drawHeader(model.title, model.subtitle);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Assigned: ${model.assignedAt}    Due: ${model.dueAt}`, margin, 108);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('Student summary', margin, 132);

  autoTable(pdf, {
    startY: 146,
    margin: { left: margin, right: margin },
    head: [['Last Name', 'First Name', 'Overall Score', 'Status']],
    body: model.summaryRows.length ? model.summaryRows : [['--', '--', '--', 'No students']],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 8, textColor: [31, 41, 55] },
    headStyles: { fillColor: [234, 247, 238], textColor: [22, 101, 52], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });
  drawFooter(1);

  model.studentSections.forEach((student, index) => {
    pdf.addPage();
    drawHeader(model.title, `${student.studentName} | ${student.status} | Overall ${student.overallScore}`);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('Quiz-mode game breakdown', margin, 116);

    autoTable(pdf, {
      startY: 130,
      margin: { left: margin, right: margin },
      head: [['Game', 'Game title', 'Score', 'Completed']],
      body: student.gameRows.length ? student.gameRows : [['--', 'No quiz games recorded', '--', '--']],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: [31, 41, 55] },
      headStyles: { fillColor: [234, 247, 238], textColor: [22, 101, 52], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    drawFooter(index + 2);
  });

  pdf.save(model.filename);
}
