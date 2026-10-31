import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router as WouterRouter } from 'wouter';

import { AuthProvider, useAuth } from '@features/auth/provider';
import { LanguageProvider } from '@features/i18n/provider';
import { OfflineClassroomProvider } from '@/lib/offline/classroom/useOfflineClassroom';
import { AppRoutes } from '@app/routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthenticatedApp() {
  const { teacherUser } = useAuth();

  return (
    <OfflineClassroomProvider teacherId={teacherUser?.id ?? null}>
      <LanguageProvider>
        <WouterRouter base={((import.meta as ImportMeta & {
          env?: Record<string, string | undefined>;
        }).env?.BASE_URL ?? '').replace(/\/$/, '')}>
          <AppRoutes />
        </WouterRouter>
      </LanguageProvider>
    </OfflineClassroomProvider>
  );
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
