import { Fragment, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TeacherClassStudent } from '@/lib/api';
import { GAME_CATALOG } from '@/lib/games/catalog';

function formatPct(value: number | null) {
  return value == null ? '--' : `${value}%`;
}

function formatScore(score: number | null, maxScore: number | null, scorePct: number | null) {
  if (score == null || maxScore == null || scorePct == null) {
    return '--';
  }

  return `${score} / ${maxScore} (${scorePct}%)`;
}

export function TeacherStudentProgressTable({
  students,
}: {
  students: TeacherClassStudent[];
}) {
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  return (
    <div className="min-w-0 overflow-x-auto rounded-[24px] border-2 border-border bg-white">
      <table className="w-full min-w-[980px] border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-border bg-muted/40">
            <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Last Name</th>
            <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">First Name</th>
            <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Overall Score</th>
            <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">% of app completed</th>
            <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">% on last played</th>
            <th className="whitespace-nowrap p-4 font-bold text-muted-foreground">Game Scores</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center font-bold text-muted-foreground">
                No detailed progress yet.
              </td>
            </tr>
          )}
          {students.map((student) => {
            const isExpanded = expandedStudentId === student.id;
            const detailsId = `student-game-scores-${student.id}`;

            return (
              <Fragment key={student.id}>
                <tr className="border-b border-border/60">
                  <td className="whitespace-nowrap p-4 font-bold">{student.lastName ?? '--'}</td>
                  <td className="whitespace-nowrap p-4 font-bold">{student.firstName}</td>
                  <td className="whitespace-nowrap p-4 font-bold">
                    {formatScore(student.overallScore, student.overallMaxScore, student.overallScorePct)}
                  </td>
                  <td className="whitespace-nowrap p-4 font-bold">{formatPct(student.appCompletionPct)}</td>
                  <td className="whitespace-nowrap p-4 font-bold">{formatPct(student.lastPlayedPct)}</td>
                  <td className="whitespace-nowrap p-4">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl border-2 border-border px-3 py-2 text-sm font-bold text-foreground hover:bg-muted"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                    >
                      {isExpanded ? 'Hide games' : 'View games'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td id={detailsId} colSpan={6} className="bg-muted/20 p-4 sm:p-6">
                      <div className="grid min-w-0 gap-4">
                        {(student.assignments ?? []).map((assignment) => {
                          const assignmentScoresByGameId = new Map(
                            assignment.gameScores.map((game) => [game.gameId, game]),
                          );

                          return (
                            <section key={assignment.assignmentId} className="min-w-0 rounded-2xl border-2 border-border/60 bg-white p-4 sm:p-5">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-lg font-extrabold">{assignment.name || assignment.lessonId}</p>
                                  <p className="text-sm font-bold capitalize text-muted-foreground">
                                    {assignment.lessonId} - {assignment.status.replace('_', ' ')}
                                  </p>
                                </div>
                                <p className="text-sm font-extrabold text-primary">
                                  Overall: {formatScore(
                                    assignment.overallScore,
                                    assignment.overallMaxScore,
                                    assignment.overallScorePct,
                                  )}
                                </p>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {GAME_CATALOG.map((game) => {
                                  const result = assignmentScoresByGameId.get(game.gameId);

                                  return (
                                    <div key={game.gameId} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
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
                            </section>
                          );
                        })}
                        {!(student.assignments ?? []).length && (
                          <p className="font-bold text-muted-foreground">No classroom assignments yet.</p>
                        )}
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
  );
}
