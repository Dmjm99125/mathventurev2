import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { AssignmentQuizStatus } from '@/lib/api/client';
import { GAME_CATALOG } from '@/lib/games/catalog';
import type { TeacherAssignedQuiz } from '@/lib/teacher/assigned-quizzes';

function formatScore(score: number | null, maxScore: number | null, scorePct: number | null) {
  return score == null || maxScore == null || scorePct == null
    ? '--'
    : `${score} / ${maxScore} (${scorePct}%)`;
}

function formatStatus(status: AssignmentQuizStatus) {
  return status === 'not_started' ? 'Not started' : status === 'in_progress' ? 'In progress' : 'Completed';
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No due date';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

export function TeacherAssignedQuizzes({
  assignments,
  error,
  onRetry,
}: {
  assignments: TeacherAssignedQuiz[];
  error?: Error | null;
  onRetry?: () => void;
}) {
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  if (error) {
    return (
      <Card role="alert" className="rounded-[24px] p-6">
        <p className="font-bold text-destructive">
          {error.message || "We couldn't load assigned quizzes right now."}
        </p>
        {onRetry && (
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="rounded-[24px] p-8 text-center font-bold text-muted-foreground">
        No quizzes have been assigned to this classroom yet.
      </Card>
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      {assignments.map(({ assignment, students }) => {
        const isAssignmentExpanded = expandedAssignmentId === assignment.id;
        const assignmentDetailsId = `assigned-quiz-details-${assignment.id}`;
        const completedCount = students.filter((student) => student.status === 'completed').length;
        const startedCount = students.filter((student) => student.status !== 'not_started').length;

        return (
          <Card key={assignment.id} className="min-w-0 overflow-hidden rounded-[24px]">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-4 p-5 text-left hover:bg-muted/30 sm:p-6"
              aria-expanded={isAssignmentExpanded}
              aria-controls={assignmentDetailsId}
              onClick={() => {
                setExpandedAssignmentId(isAssignmentExpanded ? null : assignment.id);
                setExpandedStudentId(null);
              }}
            >
              <span className="min-w-0">
                <span className="block truncate text-lg font-extrabold sm:text-xl">
                  {assignment.name || assignment.lessonId}
                </span>
                <span className="mt-1 block text-sm font-bold text-muted-foreground">
                  Lesson: {assignment.lessonId}
                </span>
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground sm:text-sm">
                  <span>Assigned: {formatDate(assignment.createdAt)}</span>
                  <span>Due: {formatDate(assignment.dueAt)}</span>
                  <span>{completedCount}/{students.length} completed</span>
                  {startedCount > completedCount && <span>{startedCount} started</span>}
                </span>
              </span>
              <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition-transform ${isAssignmentExpanded ? 'rotate-180' : ''}`} />
            </button>

            {isAssignmentExpanded && (
              <div id={assignmentDetailsId} className="border-t-2 border-border/60 bg-muted/10 p-4 sm:p-6">
                {students.length === 0 ? (
                  <p className="font-bold text-muted-foreground">No students are currently available for this quiz.</p>
                ) : (
                  <div className="min-w-0 overflow-x-auto rounded-2xl border-2 border-border/60 bg-white">
                    <table className="w-full min-w-[680px] border-collapse text-left">
                      <thead>
                        <tr className="border-b-2 border-border bg-muted/40">
                          <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Last Name</th>
                          <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">First Name</th>
                          <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Overall Score</th>
                          <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Status</th>
                          <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => {
                          const studentKey = `${assignment.id}:${student.id}`;
                          const isStudentExpanded = expandedStudentId === studentKey;
                          const studentDetailsId = `assigned-quiz-student-details-${assignment.id}-${student.id}`;
                          const scoresByGameId = new Map(student.gameScores.map((game) => [game.gameId, game]));

                          return (
                            <Fragment key={studentKey}>
                              <tr className="border-b border-border/60">
                                <td className="whitespace-nowrap p-4 font-bold">{student.lastName ?? '--'}</td>
                                <td className="whitespace-nowrap p-4 font-bold">{student.firstName}</td>
                                <td className="whitespace-nowrap p-4 font-bold">
                                  {formatScore(student.overallScore, student.overallMaxScore, student.overallScorePct)}
                                </td>
                                <td className="whitespace-nowrap p-4 font-bold">{formatStatus(student.status)}</td>
                                <td className="whitespace-nowrap p-4">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-muted"
                                    aria-expanded={isStudentExpanded}
                                    aria-controls={studentDetailsId}
                                    onClick={() => setExpandedStudentId(isStudentExpanded ? null : studentKey)}
                                  >
                                    {isStudentExpanded ? 'Hide games' : 'View games'}
                                    <ChevronDown className={`h-4 w-4 transition-transform ${isStudentExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </td>
                              </tr>
                              {isStudentExpanded && (
                                <tr>
                                  <td id={studentDetailsId} colSpan={5} className="bg-muted/20 p-4 sm:p-6">
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                      {GAME_CATALOG.filter((game) => game.topicId === assignment.lessonId).map((game) => {
                                        const result = scoresByGameId.get(game.gameId);

                                        return (
                                          <div key={game.gameId} className="rounded-2xl border border-border/60 bg-white p-4">
                                            <p className="font-bold">{game.title}</p>
                                            <p className="mt-2 text-sm font-bold text-muted-foreground">
                                              {formatScore(
                                                result?.score ?? null,
                                                result?.maxScore ?? null,
                                                result?.scorePct ?? null,
                                              )}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
