import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeFunction = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@infrastructure/api/transport', () => ({
  invokeFunction,
}));

import { attemptApi, postApi } from './attempt-post';

describe('attempt and post API contracts', () => {
  beforeEach(() => {
    invokeFunction.mockClear();
  });

  it('preserves attempt submission payloads', async () => {
    const input = {
      lessonId: 'lesson-1',
      assignmentId: 'assignment-1',
      classId: 'class-1',
      score: 8,
      maxScore: 10,
      durationSeconds: 90,
      gameResults: [],
    };

    await attemptApi.submit(input);

    expect(invokeFunction).toHaveBeenCalledWith('attempts-submit', {
      method: 'POST',
      body: input,
    });
  });

  it('preserves post list and creation requests', async () => {
    await postApi.list('class-1');
    await postApi.create('class-1', 'Remember your homework.');

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'posts-list', {
      searchParams: { classId: 'class-1' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'posts-create', {
      method: 'POST',
      body: { classId: 'class-1', content: 'Remember your homework.' },
    });
  });
});
