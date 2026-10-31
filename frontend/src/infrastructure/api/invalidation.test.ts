import { describe, expect, it, vi } from 'vitest';
import {
  assignmentKeys,
  classroomKeys,
  dashboardKeys,
  postKeys,
} from './queryKeys';
import {
  invalidateAssignmentCreated,
  invalidateAssignmentCompleted,
  invalidateAssignmentChanged,
  invalidateAttemptSubmitted,
  invalidateClassCreated,
  invalidateClassChanged,
  invalidateStudentJoined,
  invalidateRosterChanged,
  invalidatePostCreated,
} from './invalidation';

function createQueryClient() {
  return { invalidateQueries: vi.fn().mockResolvedValue(undefined) };
}

function invalidatedKeys(queryClient: ReturnType<typeof createQueryClient>) {
  return queryClient.invalidateQueries.mock.calls.map(([input]) => input.queryKey);
}

describe('query invalidation policy', () => {
  it('preserves student assignment and attempt invalidations', () => {
    const queryClient = createQueryClient();

    invalidateAssignmentCompleted(queryClient, 'assignment-1', 'colors');
    expect(invalidatedKeys(queryClient)).toEqual([
      assignmentKeys.quiz('assignment-1', 'colors'),
      assignmentKeys.all(),
      dashboardKeys.student(),
    ]);

    queryClient.invalidateQueries.mockClear();
    invalidateAttemptSubmitted(queryClient);
    expect(invalidatedKeys(queryClient)).toEqual([
      dashboardKeys.student(),
      assignmentKeys.all(),
    ]);
  });

  it('preserves teacher assignment invalidations', () => {
    const queryClient = createQueryClient();

    invalidateAssignmentCreated(queryClient, 'class-1');
    expect(invalidatedKeys(queryClient)).toEqual([
      assignmentKeys.list('class-1'),
      assignmentKeys.list(),
    ]);

    queryClient.invalidateQueries.mockClear();
    invalidateAssignmentChanged(queryClient);
    expect(invalidatedKeys(queryClient)).toEqual([
      assignmentKeys.all(),
      classroomKeys.roster(),
      dashboardKeys.teacher(),
    ]);
  });

  it('preserves classroom and post invalidations', () => {
    const queryClient = createQueryClient();

    invalidateClassCreated(queryClient);
    expect(invalidatedKeys(queryClient)).toEqual([
      classroomKeys.teacher(),
      classroomKeys.all(),
      dashboardKeys.teacher(),
    ]);

    queryClient.invalidateQueries.mockClear();
    invalidateClassChanged(queryClient, 'class-1');
    expect(invalidatedKeys(queryClient)).toEqual([
      classroomKeys.all(),
      classroomKeys.teacher('class-1'),
      dashboardKeys.teacher(),
    ]);

    queryClient.invalidateQueries.mockClear();
    invalidateStudentJoined(queryClient);
    expect(invalidatedKeys(queryClient)).toEqual([
      classroomKeys.student(),
      classroomKeys.all(),
    ]);

    queryClient.invalidateQueries.mockClear();
    invalidateRosterChanged(queryClient, 'class-1');
    expect(invalidatedKeys(queryClient)).toEqual([
      classroomKeys.roster(),
      classroomKeys.classesRoster('class-1'),
      classroomKeys.all(),
      dashboardKeys.teacher(),
    ]);

    queryClient.invalidateQueries.mockClear();
    invalidatePostCreated(queryClient, 'class-1');
    expect(invalidatedKeys(queryClient)).toEqual([postKeys.list('class-1')]);
  });
});
