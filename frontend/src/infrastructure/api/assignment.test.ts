import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeFunction = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@infrastructure/api/transport', () => ({
  invokeFunction,
}));

import { assignmentApi } from './assignment';

describe('assignment API contract', () => {
  beforeEach(() => {
    invokeFunction.mockClear();
  });

  it('preserves assignment list pagination parameters', async () => {
    await assignmentApi.list('class-1', { cursor: 'next', pageSize: 10 });

    expect(invokeFunction).toHaveBeenCalledWith('assignments-list', {
      searchParams: { classId: 'class-1', pageSize: '10', cursor: 'next' },
    });
  });

  it('preserves assignment mutation payloads', async () => {
    const input = { lessonId: 'lesson-1', name: 'Fractions', classId: 'class-1', dueAt: '2026-11-01' };

    await assignmentApi.create(input);
    await assignmentApi.update({ assignmentId: 'assignment-1', ...input });
    await assignmentApi.delete('assignment-1');

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'assignments-create', {
      method: 'POST',
      body: input,
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'assignments-update', {
      method: 'POST',
      body: { assignmentId: 'assignment-1', ...input },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(3, 'assignments-delete', {
      method: 'POST',
      body: { assignmentId: 'assignment-1' },
    });
  });

  it('preserves assignment quiz reads and lifecycle actions', async () => {
    const gameResult = {
      topicId: 'topic-1',
      gameId: 'game-1',
      gameOrder: 1,
      score: 8,
      maxScore: 10,
    };

    await assignmentApi.quiz.get('assignment-1', 'lesson-1');
    await assignmentApi.quiz.start('assignment-1', 'lesson-1');
    await assignmentApi.quiz.checkpoint({
      assignmentId: 'assignment-1',
      lessonId: 'lesson-1',
      score: 8,
      gameResult,
    });
    await assignmentApi.quiz.complete({
      assignmentId: 'assignment-1',
      lessonId: 'lesson-1',
      score: 10,
      maxScore: 10,
      gameResults: [gameResult],
    });

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'assignment-quiz', {
      searchParams: { assignmentId: 'assignment-1', lessonId: 'lesson-1' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'assignment-quiz', {
      method: 'POST',
      body: { action: 'start', assignmentId: 'assignment-1', lessonId: 'lesson-1' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(3, 'assignment-quiz', {
      method: 'POST',
      body: { action: 'checkpoint', assignmentId: 'assignment-1', lessonId: 'lesson-1', score: 8, gameResult },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(4, 'assignment-quiz', {
      method: 'POST',
      body: {
        action: 'complete',
        assignmentId: 'assignment-1',
        lessonId: 'lesson-1',
        score: 10,
        maxScore: 10,
        gameResults: [gameResult],
      },
    });
  });
});
