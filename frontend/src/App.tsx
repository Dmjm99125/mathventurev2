import { Redirect, Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';
import { LanguageProvider } from '@/lib/i18n/useLanguage';
import { OfflineClassroomProvider } from '@/lib/offline/classroom/useOfflineClassroom';

// Pages
import { Landing } from '@/pages/landing';
import { FreePlay } from '@/pages/free-play';
import { About } from '@/pages/about';
import { ForgotPassword, Login, PasswordReset, Signup } from '@/pages/auth';
import {
  TeacherTodayPage,
  TeacherStudentsPage,
  TeacherAssignmentsPage,
  TeacherReportsPage,
  TeacherSettingsPage,
  TeacherClassesPage,
  TeacherClassWorkspacePage,
} from '@/pages/teacher';
import { StudentDashboard, StudentClassroomPage } from '@/pages/student';
import { QuizPage } from '@/pages/QuizPage';
import NotFound from '@/pages/not-found';

import { AppLayout } from '@/components/layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/free-play" component={FreePlay} />
      <Route path="/about" component={About} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={PasswordReset} />
      
      <Route path="/student">
        {() => <AppLayout sidebarMode="hidden"><StudentDashboard /></AppLayout>}
      </Route>
      <Route path="/student/classroom">
        {() => <AppLayout sidebarMode="hidden"><StudentClassroomPage /></AppLayout>}
      </Route>
      <Route path="/student/lessons">
        {() => <Redirect to="/student" replace />}
      </Route>
      <Route path="/student/lessons/:topic">
        {() => <QuizPage />}
      </Route>
      <Route path="/student/classes/:classId">
        {() => <Redirect to="/student/classroom" replace />}
      </Route>
      
      <Route path="/teacher">
        {() => <AppLayout sidebarMode="hidden"><TeacherClassesPage /></AppLayout>}
      </Route>
      <Route path="/teacher/students">
        {() => <Redirect to="/teacher" replace />}
      </Route>
      <Route path="/teacher/assignments">
        {() => <Redirect to="/teacher" replace />}
      </Route>
      <Route path="/teacher/classes">
        {() => <Redirect to="/teacher" replace />}
      </Route>
      <Route path="/teacher/classes/:classId/:section">
        {({ classId, section }) => <AppLayout sidebarMode="hidden"><TeacherClassWorkspacePage classId={classId} section={section as 'today' | 'students' | 'assignments' | 'reports'} /></AppLayout>}
      </Route>
      <Route path="/teacher/classes/:classId">
        {({ classId }) => <AppLayout sidebarMode="hidden"><TeacherClassWorkspacePage classId={classId} /></AppLayout>}
      </Route>
      <Route path="/teacher/reports">
        {() => <Redirect to="/teacher" replace />}
      </Route>
      <Route path="/teacher/settings">
        {() => <AppLayout sidebarMode="hidden"><TeacherSettingsPage /></AppLayout>}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineClassroomProvider>
        <AuthProvider>
          <LanguageProvider>
            <WouterRouter base={((import.meta as ImportMeta & {
              env?: Record<string, string | undefined>;
            }).env?.BASE_URL ?? '').replace(/\/$/, '')}>
              <AppRoutes />
            </WouterRouter>
          </LanguageProvider>
        </AuthProvider>
      </OfflineClassroomProvider>
    </QueryClientProvider>
  );
}

export default App;

