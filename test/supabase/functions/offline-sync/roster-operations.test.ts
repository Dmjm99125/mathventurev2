import { assertEquals } from 'jsr:@std/assert';
import {
  createRosterOperationApplier,
  type RosterOperationPersistence,
} from '../../../../supabase/functions/_shared/offline_operations.ts';

Deno.test('class.addStudents rejects duplicate normalized names in one offline batch', async () => {
  const persistence: RosterOperationPersistence = {
    getTeacherClassroom: async () => ({ id: 'class-1', teacherId: 'teacher-1', name: 'Classroom' }),
    hasStudentWithNormalizedName: async () => false,
    provisionStudentForClass: async () => ({ studentId: 'student-1', email: 'student@example.test' }),
    removeMembership: async () => {},
  };
  const apply = createRosterOperationApplier(persistence);
  const result = await apply('teacher-1', {
    operationId: 'operation-1',
    deviceId: 'device-1',
    actorId: 'teacher-1',
    type: 'class.addStudents',
    entityId: 'batch-1',
    payload: {
      students: [
        { lastName: 'Santos', firstName: 'Ana' },
        { lastName: ' santos ', firstName: 'ANA' },
      ],
    },
    dependencies: [],
    createdAt: '2026-10-07T00:00:00.000Z',
  });

  assertEquals(result, {
    status: 'rejected',
    error: 'Each student name can appear only once per batch.',
  });
});
