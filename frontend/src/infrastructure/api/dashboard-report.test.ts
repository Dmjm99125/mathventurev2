import { beforeEach, describe, expect, it, vi } from 'vitest';

const invokeFunction = vi.hoisted(() => vi.fn().mockResolvedValue({}));

vi.mock('@infrastructure/api/transport', () => ({
  invokeFunction,
}));

import { dashboardApi, reportApi } from './dashboard-report';

describe('dashboard and report API contracts', () => {
  beforeEach(() => {
    invokeFunction.mockClear();
  });

  it('preserves dashboard endpoints', async () => {
    await dashboardApi.student();
    await dashboardApi.teacher();

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'dashboard-student');
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'dashboard-teacher');
  });

  it('preserves report endpoint parameters and pagination', async () => {
    await reportApi.overview('class-1', '30d', { studentCursor: 'next', pageSize: 20 });
    await reportApi.classDetail('class-1', '7d');

    expect(invokeFunction).toHaveBeenNthCalledWith(1, 'reports-overview', {
      searchParams: { classId: 'class-1', window: '30d', cursor: 'next', pageSize: '20' },
    });
    expect(invokeFunction).toHaveBeenNthCalledWith(2, 'reports-class', {
      searchParams: { classId: 'class-1', window: '7d' },
    });
  });
});
