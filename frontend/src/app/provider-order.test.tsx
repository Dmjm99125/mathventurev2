import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const renderOrder = vi.hoisted(() => [] as string[]);

vi.mock('@tanstack/react-query', () => ({
  QueryClient: class QueryClient {
    constructor() {
      renderOrder.push('query-client');
    }
  },
  QueryClientProvider: ({ children }: { children: unknown }) => {
    renderOrder.push('query-provider');
    return children;
  },
}));

vi.mock('wouter', () => ({
  Router: ({ children }: { children: unknown }) => {
    renderOrder.push('router');
    return children;
  },
}));

vi.mock('@/lib/auth', () => ({
  AuthProvider: ({ children }: { children: unknown }) => {
    renderOrder.push('auth');
    return children;
  },
  useAuth: () => ({ teacherUser: null }),
}));

vi.mock('@/lib/offline/classroom/useOfflineClassroom', () => ({
  OfflineClassroomProvider: ({ children }: { children: unknown }) => {
    renderOrder.push('offline');
    return children;
  },
}));

vi.mock('@/lib/i18n/useLanguage', () => ({
  LanguageProvider: ({ children }: { children: unknown }) => {
    renderOrder.push('language');
    return children;
  },
}));

vi.mock('@app/routes', () => ({
  AppRoutes: () => {
    renderOrder.push('routes');
    return null;
  },
}));

describe('application provider composition', () => {
  it('keeps infrastructure providers outside the route tree in the current order', async () => {
    renderOrder.length = 0;
    const { default: App } = await import('../App');

    render(<App />);

    expect(renderOrder).toEqual([
      'query-client',
      'query-provider',
      'auth',
      'offline',
      'language',
      'router',
      'routes',
    ]);
  });
});
