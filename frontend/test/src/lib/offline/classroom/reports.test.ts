import { assertEquals } from 'jsr:@std/assert';
import {
  buildOfflineStudentDashboard,
  buildOfflineTeacherClassReport,
} from '../../../../../src/lib/offline/classroom/reports.ts';

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

Deno.test('offline teacher reports derive the cached classroom shape', () => {
  const report = buildOfflineTeacherClassReport(
    [{ id: 'class-1', name: 'Room', join_code: 'ROOM1' }],
    [{
      class_id: 'class-1',
      student_id: 'student-1',
      joined_at: '2026-10-07T00:00:00.000Z',
      profiles: { full_name: 'Ana Student' },
    }],
    [{
      class_id: 'class-1',
      student_id: 'student-1',
      topic_id: 'numbers',
      game_id: 'numbers-1',
      game_order: 1,
      score: 8,
      max_score: 10,
      score_pct: 80,
      passed: true,
      completed_at: '2026-10-07T00:10:00.000Z',
    }],
    'class-1',
    'all',
  );

  assertEquals(report.classroomSummary.id, 'class-1');
  assertEquals(report.classroomSummary.studentCount, 1);
  assertEquals(report.studentRows[0].fullName, 'Ana Student');
  assertEquals(report.hasData, true);
});
