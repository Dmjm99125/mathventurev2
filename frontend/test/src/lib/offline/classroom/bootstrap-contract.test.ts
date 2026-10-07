import { assert, assertEquals } from 'jsr:@std/assert';
import { downloadClassroomPack } from '../../../../../src/lib/offline/classroom/bootstrap.ts';
import { isOfflineBootstrapResponse } from '../../../../../src/lib/offline/classroom/types.ts';

Deno.test('bootstrap contract requires a revision and classroom collections', () => {
  assert(isOfflineBootstrapResponse({
    revision: 1,
    teacher: { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' },
    classroom: null,
    students: [],
    assignments: [],
    attempts: [],
    gameResults: [],
    posts: [],
  }));
});

Deno.test('downloadClassroomPack validates the server response', async () => {
  const response = await downloadClassroomPack(async () => ({
    revision: 3,
    teacher: { id: 'teacher-1', role: 'teacher', fullName: 'Teacher' },
    classroom: null,
    students: [],
    assignments: [],
    attempts: [],
    gameResults: [],
    posts: [],
  }));
  assertEquals(response.revision, 3);
});
