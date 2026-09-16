import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { TeacherAssignedQuizPdfButton } from '@/components/teacher/TeacherAssignedQuizPdfButton';
import type { AssignmentQuizStatus } from '@/lib/api/client';
import { GAME_CATALOG } from '@/lib/games/catalog';
import { getTeacherAssignedQuizName, type TeacherAssignedQuiz } from '@/lib/teacher/assigned-quizzes';

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
      <Card role="alert" className="teacher-section border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-6">
        <p className="font-bold text-[var(--teacher-ink)]">
          {error.message || "We couldn't load assigned quizzes right now."}
        </p>
        {onRetry && (
          <Button className="mt-4 border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="teacher-section border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-8 text-center font-semibold text-[var(--teacher-ink)]/65">
        No quizzes have been assigned to this classroom yet.
      </Card>
    );
  }

  return (
    <div className="teacher-assignment-list grid min-w-0 gap-6" aria-label="Assigned quizzes">
      {assignments.map(({ assignment, students }) => {
        const assignmentName = getTeacherAssignedQuizName(assignment);
        const isAssignmentExpanded = expandedAssignmentId === assignment.id;
        const assignmentDetailsId = `assigned-quiz-details-${assignment.id}`;
        const completedCount = students.filter((student) => student.status === 'completed').length;
        const startedCount = students.filter((student) => student.status !== 'not_started').length;

        return (
          <Card key={assignment.id} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45 shadow-none">
            <div className="flex items-start gap-3 p-5 sm:p-6">
              <button
                type="button"
                className="min-w-0 flex-1 text-left hover:bg-muted/30"
                aria-expanded={isAssignmentExpanded}
                aria-controls={assignmentDetailsId}
                onClick={() => {
                  setExpandedAssignmentId(isAssignmentExpanded ? null : assignment.id);
                  setExpandedStudentId(null);
                }}
              >
                <span className="block truncate text-lg font-extrabold sm:text-xl">
                  {assignmentName}
                </span>
                <span className="mt-1 block text-sm font-semibold text-[var(--teacher-ink)]/65">
                  Lesson: {assignment.lessonId}
                </span>
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold tabular-nums text-[var(--teacher-ink)]/65 sm:text-sm">
                  <span>Assigned: {formatDate(assignment.createdAt)}</span>
                  <span>Due: {formatDate(assignment.dueAt)}</span>
                  <span>{completedCount}/{students.length} completed</span>
                  {startedCount > completedCount && <span>{startedCount} started</span>}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-2">
                <TeacherAssignedQuizPdfButton quiz={{ assignment, students }} />
                <button
                  type="button"
                  aria-label={`${isAssignmentExpanded ? 'Collapse' : 'Expand'} ${assignmentName}`}
                  aria-expanded={isAssignmentExpanded}
                  aria-controls={assignmentDetailsId}
                  className="rounded-xl p-2 text-[var(--teacher-ink)] hover:bg-[var(--teacher-sage)]/20"
                  onClick={() => {
                    setExpandedAssignmentId(isAssignmentExpanded ? null : assignment.id);
                    setExpandedStudentId(null);
                  }}
                >
                  <ChevronDown className={`h-5 w-5 transition-transform ${isAssignmentExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {isAssignmentExpanded && (
              <div id={assignmentDetailsId} className="border-t border-[var(--teacher-moss)]/20 bg-[var(--teacher-sage)]/10 p-4 sm:p-6">
                {students.length === 0 ? (
                  <p className="font-bold text-muted-foreground">No students are currently available for this quiz.</p>
                ) : (
                  <div className="min-w-0 overflow-x-auto rounded-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/45">
                    <table aria-label="Assigned quiz results" className="w-full min-w-[680px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[var(--teacher-moss)]/20 bg-[var(--teacher-sage)]/18">
                          <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">Last Name</th>
                          <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">First Name</th>
                          <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">Overall Score</th>
                          <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">Status</th>
                          <th className="whitespace-nowrap p-4 text-sm font-bold text-[var(--teacher-ink)]/65">Details</th>
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
                              <tr className="border-b border-[var(--teacher-moss)]/15">
                                <td className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]">{student.lastName ?? '--'}</td>
                                <td className="whitespace-nowrap p-4 font-bold text-[var(--teacher-ink)]">{student.firstName}</td>
                                <td className="whitespace-nowrap p-4 font-bold tabular-nums text-[var(--teacher-ink)]">
                                  {formatScore(student.overallScore, student.overallMaxScore, student.overallScorePct)}
                                </td>
                                <td className="whitespace-nowrap p-4 font-semibold text-[var(--teacher-ink)]">{formatStatus(student.status)}</td>
                                <td className="whitespace-nowrap p-4">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--teacher-moss)]/30 px-3 py-2 text-sm font-bold text-[var(--teacher-ink)] hover:bg-[var(--teacher-sage)]/20"
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
                                  <td id={studentDetailsId} colSpan={5} className="bg-[var(--teacher-sage)]/10 p-4 sm:p-6">
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                      {GAME_CATALOG.filter((game) => game.topicId === assignment.lessonId).map((game) => {
                                        const result = scoresByGameId.get(game.gameId);

                                        return (
                                          <div key={game.gameId} className="rounded-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-4">
                                            <p className="font-bold text-[var(--teacher-ink)]">{game.title}</p>
                                            <p className="mt-2 text-sm font-bold tabular-nums text-[var(--teacher-ink)]/65">
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
