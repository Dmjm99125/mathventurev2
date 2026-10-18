import { assertEquals } from 'jsr:@std/assert';
import { createMemoryStore } from '../../../../../src/lib/offline/classroom/memoryStore.ts';
import { createOfflineRepository } from '../../../../../src/lib/offline/classroom/repository.ts';
import {
  readOfflineAssignments,
  readOfflineRoster,
} from '../../../../../src/lib/offline/classroom/queries.ts';
import { readOfflinePosts, buildOfflineTeacherClassReport } from '../../../../../src/lib/offline/classroom/reports.ts';

Deno.test('offline teacher data stays isolated by selected class', async () => {
  const repository = createOfflineRepository(createMemoryStore());
  await repository.putSnapshot('classrooms', [
    { id: 'class-1', name: 'Room One', created_at: '2026-10-01T00:00:00.000Z' },
    { id: 'class-2', name: 'Room Two', created_at: '2026-10-02T00:00:00.000Z' },
  ]);
  await repository.putSnapshot('classStudents', [
    { id: 'membership-1', class_id: 'class-1', student_id: 'student-1', joined_at: '2026-10-01T01:00:00.000Z', profiles: { id: 'student-1', full_name: 'Ana One' } },
    { id: 'membership-2', class_id: 'class-2', student_id: 'student-2', joined_at: '2026-10-02T01:00:00.000Z', profiles: { id: 'student-2', full_name: 'Ben Two' } },
  ]);
  await repository.putSnapshot('assignments', [
    { id: 'assignment-1', class_id: 'class-1', lesson_id: 'lesson-1', name: 'Room one quiz', created_at: '2026-10-01T02:00:00.000Z' },
    { id: 'assignment-2', class_id: 'class-2', lesson_id: 'lesson-2', name: 'Room two quiz', created_at: '2026-10-02T02:00:00.000Z' },
  ]);
  await repository.putSnapshot('attemptGameResults', [
    { id: 'result-1', class_id: 'class-1', student_id: 'student-1', topic_id: 'numbers', game_id: 'numbers-1', game_order: 1, score: 8, max_score: 10, score_pct: 80, passed: true, completed_at: '2026-10-01T03:00:00.000Z' },
    { id: 'result-2', class_id: 'class-2', student_id: 'student-2', topic_id: 'fractions', game_id: 'fractions-1', game_order: 1, score: 2, max_score: 10, score_pct: 20, passed: false, completed_at: '2026-10-02T03:00:00.000Z' },
  ]);
  await repository.putSnapshot('posts', [
    { id: 'post-1', class_id: 'class-1', content: 'Room one post', created_at: '2026-10-01T04:00:00.000Z', author_name: 'Teacher' },
    { id: 'post-2', class_id: 'class-2', content: 'Room two post', created_at: '2026-10-02T04:00:00.000Z', author_name: 'Teacher' },
  ]);

  assertEquals((await readOfflineRoster(repository, 'class-1')).students.map((student) => student.id), ['student-1']);
  assertEquals((await readOfflineAssignments(repository, 'class-1', null)).map((assignment) => assignment.id), ['assignment-1']);
  assertEquals((await readOfflinePosts(repository, 'class-1')).map((post) => post.id), ['post-1']);

  const report = buildOfflineTeacherClassReport(
    await repository.readCollection('classrooms'),
    await repository.readCollection('classStudents'),
    await repository.readCollection('attemptGameResults'),
    'class-1',
    'all',
  );
  assertEquals(report.studentRows.map((student) => student.studentId), ['student-1']);
  assertEquals(report.studentRows[0]?.averageScorePct, 80);
});
