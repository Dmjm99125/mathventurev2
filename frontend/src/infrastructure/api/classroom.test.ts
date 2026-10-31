import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeFunction = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@infrastructure/api/transport', () => ({
  invokeFunction,
}));

import { classroomApi } from './classroom';

describe('classroom API contract', () => {
  beforeEach(() => {
    invokeFunction.mockClear();
  });

  it('lists classrooms through the existing endpoint', async () => {
    await classroomApi.list();

    expect(invokeFunction).toHaveBeenCalledWith('classes-list');
  });

  it('sends classroom mutations with the existing POST payloads', async () => {
    await classroomApi.create('Year 5');
    await classroomApi.update({ classId: 'class-1', action: 'rename', name: 'New name' });
    await classroomApi.join('JOIN123');

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'classes-create', {
      method: 'POST',
      body: { name: 'Year 5' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'classes-update', {
      method: 'POST',
      body: { classId: 'class-1', action: 'rename', name: 'New name' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(3, 'classes-join', {
      method: 'POST',
      body: { joinCode: 'JOIN123' },
    });
  });

  it('preserves roster pagination and student lookup parameters', async () => {
    await classroomApi.roster('class-1', { cursor: 'next', pageSize: 25 });
    await classroomApi.rosterStudent('class-1', 'student-1');

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'classes-roster', {
      searchParams: { classId: 'class-1', pageSize: '25', cursor: 'next' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'classes-roster', {
      searchParams: { classId: 'class-1', studentId: 'student-1' },
    });
  });

  it('preserves add and remove student payloads', async () => {
    const students = [{ email: 'student@example.com', firstName: 'A', lastName: 'Student' }];

    await classroomApi.addStudents('class-1', students);
    await classroomApi.removeStudent('class-1', 'student-1');

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'classes-add-students', {
      method: 'POST',
      body: { classId: 'class-1', students },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'classes-remove-student', {
      method: 'POST',
      body: { classId: 'class-1', studentId: 'student-1' },
    });
  });
});
