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
