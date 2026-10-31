import { Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n/useLanguage';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

