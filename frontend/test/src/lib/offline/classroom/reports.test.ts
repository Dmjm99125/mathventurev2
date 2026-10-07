import { assertEquals } from 'jsr:@std/assert';
import { buildOfflineStudentDashboard } from '../../../../../src/lib/offline/classroom/reports.ts';

Deno.test('offline student reports count completed lessons and recent attempts', () => {
  const dashboard = buildOfflineStudentDashboard([
    {
      id: 'attempt-1',
      student_id: 'student-1',
      lesson_id: 'lesson-1',
      status: 'completed',
      score: 8,
      max_score: 10,
      completed_at: '2026-10-07T00:00:00.000Z',
    },
  ]);

  assertEquals(dashboard.completedLessons, 1);
  assertEquals(dashboard.recentAttempts, [{
    lessonId: 'lesson-1',
    score: 8,
    maxScore: 10,
    completedAt: '2026-10-07T00:00:00.000Z',
  }]);
});
