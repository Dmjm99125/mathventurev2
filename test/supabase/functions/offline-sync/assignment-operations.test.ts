import { assertEquals } from 'jsr:@std/assert';
import {
  createAssignmentOperationApplier,
  type AssignmentOperationPersistence,
} from '../../../../supabase/functions/_shared/offline_operations.ts';

const operation = {
  operationId: 'operation-1',
  deviceId: 'device-1',
  actorId: 'teacher-1',
  type: 'assignment.create' as const,
  entityId: 'client-assignment-1',
  payload: {
    lessonId: 'lesson-1',
    classId: 'class-1',
    name: 'Offline colors',
    dueAt: null,
  },
  dependencies: [],
  createdAt: '2026-10-07T00:00:00.000Z',
};

Deno.test('assignment.create preserves the client ID and validates classroom ownership', async () => {
  let inserted: Record<string, unknown> | null = null;
  const persistence: AssignmentOperationPersistence = {
    isTeacherForClass: async (classId, teacherId) => classId === 'class-1' && teacherId === 'teacher-1',
    lessonExists: async () => true,
    insertAssignment: async (input) => {
      inserted = input;
      return input;
    },
    readAssignment: async () => null,
    updateAssignment: async () => null,
    deleteAssignment: async () => false,
  };
  const apply = createAssignmentOperationApplier(persistence);

  const accepted = await apply('teacher-1', operation);
  const rejected = await apply('teacher-1', {
    ...operation,
    entityId: 'client-assignment-2',
    payload: { ...operation.payload, classId: 'other-class' },
  });

  assertEquals(accepted.status, 'accepted');
  assertEquals((inserted as Record<string, unknown> | null)?.id, 'client-assignment-1');
  assertEquals(rejected, {
    status: 'rejected',
    error: 'The teacher does not own the target class.',
  });
});

Deno.test('stale mutable assignment edits return a conflict with both versions', async () => {
  const persistence: AssignmentOperationPersistence = {
    isTeacherForClass: async () => true,
    lessonExists: async () => true,
    insertAssignment: async (input) => input,
    readAssignment: async () => ({
      id: 'assignment-1',
      assigned_by: 'teacher-1',
      class_id: 'class-1',
      created_at: '2026-10-07T00:00:00.000Z',
      server_revision: 5,
      name: 'Server version',
    }),
    updateAssignment: async () => null,
    deleteAssignment: async () => false,
  };
  const result = await createAssignmentOperationApplier(persistence)('teacher-1', {
    ...operation,
    type: 'assignment.update',
    payload: { assignmentId: 'assignment-1', name: 'Local version', dueAt: null },
    baseRevision: 4,
  });
  assertEquals(result.status, 'conflict');
  assertEquals((result.result as { serverRevision: number }).serverRevision, 5);
});
