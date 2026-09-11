import { Fragment, useState } from 'react';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TeacherAssignedQuizPdfButton } from '@/components/teacher/TeacherAssignedQuizPdfButton';
import type { AssignmentQuizStatus } from '@/lib/api/client';
import { GAME_CATALOG } from '@/lib/games/catalog';
import { getTeacherAssignedQuizName, type TeacherAssignedQuiz } from '@/lib/teacher/assigned-quizzes';
import { useDeleteAssignment, useUpdateAssignment } from '@/lib/api/hooks';

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

function toDateInputValue(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
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
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const [editingQuiz, setEditingQuiz] = useState<TeacherAssignedQuiz | null>(null);
  const [deletingQuiz, setDeletingQuiz] = useState<TeacherAssignedQuiz | null>(null);
  const [editName, setEditName] = useState('');
  const [editDueAt, setEditDueAt] = useState('');
  const [managementError, setManagementError] = useState<string | null>(null);

  const openEditDialog = (quiz: TeacherAssignedQuiz) => {
    setEditingQuiz(quiz);
    setEditName(quiz.assignment.name || '');
    setEditDueAt(toDateInputValue(quiz.assignment.dueAt));
    setManagementError(null);
  };

  const closeEditDialog = () => {
    if (updateAssignment.isPending) return;
    setEditingQuiz(null);
    setManagementError(null);
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingQuiz) return;

    setManagementError(null);
    try {
      await updateAssignment.mutateAsync({
        assignmentId: editingQuiz.assignment.id,
        lessonId: editingQuiz.assignment.lessonId,
        name: editName,
        dueAt: editDueAt ? `${editDueAt}T23:59:59.999Z` : null,
      });
      setEditingQuiz(null);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "We couldn't update that quiz.");
    }
  };

  const confirmDelete = async () => {
    if (!deletingQuiz) return;

    setManagementError(null);
    try {
      await deleteAssignment.mutateAsync(deletingQuiz.assignment.id);
      if (expandedAssignmentId === deletingQuiz.assignment.id) {
        setExpandedAssignmentId(null);
        setExpandedStudentId(null);
      }
      setDeletingQuiz(null);
    } catch (error) {
      setManagementError(error instanceof Error ? error.message : "We couldn't delete that quiz.");
    }
  };

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
        const assignmentName = getTeacherAssignedQuizName(assignment);
        const isAssignmentExpanded = expandedAssignmentId === assignment.id;
        const assignmentDetailsId = `assigned-quiz-details-${assignment.id}`;
        const completedCount = students.filter((student) => student.status === 'completed').length;
        const startedCount = students.filter((student) => student.status !== 'not_started').length;

        return (
          <Card key={assignment.id} className="min-w-0 overflow-hidden rounded-[24px]">
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
                <span className="mt-1 block text-sm font-bold text-muted-foreground">
                  Lesson: {assignment.lessonId}
                </span>
                <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-muted-foreground sm:text-sm">
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
                  aria-label={`Edit ${assignmentName}`}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => openEditDialog({ assignment, students })}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${assignmentName}`}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setDeletingQuiz({ assignment, students });
                    setManagementError(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`${isAssignmentExpanded ? 'Collapse' : 'Expand'} ${assignmentName}`}
                  aria-expanded={isAssignmentExpanded}
                  aria-controls={assignmentDetailsId}
                  className="rounded-xl p-2 hover:bg-muted"
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

      <Dialog open={editingQuiz !== null} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit quiz</DialogTitle>
            <DialogDescription>
              Update the name or due date. The topic stays {editingQuiz?.assignment.lessonId} so existing student attempts remain valid.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveEdit} className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="edit-assignment-name" className="font-bold">Quiz name</label>
              <input
                id="edit-assignment-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={120}
                placeholder="Example: Sequencing Review"
                className="h-11 rounded-xl border-2 border-input bg-background px-3 font-bold"
              />
              <p className="text-xs font-bold text-muted-foreground">Leave blank to use the topic name.</p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="edit-assignment-due" className="font-bold">Due date</label>
              <input
                id="edit-assignment-due"
                type="date"
                value={editDueAt}
                onChange={(event) => setEditDueAt(event.target.value)}
                className="h-11 rounded-xl border-2 border-input bg-background px-3 font-bold"
              />
              <p className="text-xs font-bold text-muted-foreground">Leave blank for no due date.</p>
            </div>
            {managementError && <p className="text-sm font-bold text-destructive">{managementError}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeEditDialog}>Cancel</Button>
              <Button type="submit" variant="jungle" disabled={updateAssignment.isPending}>
                {updateAssignment.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingQuiz !== null}
        onOpenChange={(open) => {
          if (!open && !deleteAssignment.isPending) {
            setDeletingQuiz(null);
            setManagementError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this quiz?</DialogTitle>
            <DialogDescription>
              “{deletingQuiz ? getTeacherAssignedQuizName(deletingQuiz.assignment) : ''}” will be removed from the classroom. Existing student scores will remain in history but will no longer be attached to this assignment.
            </DialogDescription>
          </DialogHeader>
          {managementError && <p className="text-sm font-bold text-destructive">{managementError}</p>}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={deleteAssignment.isPending}>Cancel</Button>
            </DialogClose>
            <Button variant="danger" onClick={() => void confirmDelete()} disabled={deleteAssignment.isPending}>
              {deleteAssignment.isPending ? 'Deleting...' : 'Delete quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
