import { FileDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { downloadTeacherAssignedQuizPdf } from '@/lib/teacher/assigned-quizzes-pdf';
import { getTeacherAssignedQuizName, type TeacherAssignedQuiz } from '@/lib/teacher/assigned-quizzes';

export function TeacherAssignedQuizPdfButton({ quiz }: { quiz: TeacherAssignedQuiz }) {
  const [isExporting, setIsExporting] = useState(false);
  const quizName = getTeacherAssignedQuizName(quiz.assignment);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      aria-label={`Export ${quizName} results as PDF`}
      disabled={isExporting}
      onClick={async (event) => {
        event.stopPropagation();
        setIsExporting(true);
        try {
          await downloadTeacherAssignedQuizPdf(quiz);
        } finally {
          setIsExporting(false);
        }
      }}
    >
      <FileDown className="h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  );
}
