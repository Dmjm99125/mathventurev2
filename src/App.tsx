import { Redirect, Route, Switch, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/useAuth';
import { LanguageProvider } from '@/lib/useLanguage';

// Pages
import { Landing } from '@/pages/landing';
import { About } from '@/pages/about';
import { Login, Signup } from '@/pages/auth';
import {
  TeacherWorkspacePage,
  TeacherClassReportPage,
  TeacherReportsOverviewPage,
  TeacherSettingsPlaceholder,
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
      <Route path="/about" component={About} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/student">
        {() => <AppLayout sidebarMode="hidden"><StudentDashboard /></AppLayout>}
      </Route>
      <Route path="/student/classroom">
        {() => <AppLayout><StudentClassroomPage /></AppLayout>}
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
        {() => <AppLayout sidebarMode="hidden"><TeacherWorkspacePage /></AppLayout>}
      </Route>
      <Route path="/teacher/classes">
        {() => <Redirect to="/teacher" replace />}
      </Route>
      <Route path="/teacher/classes/:classId">
        {() => <Redirect to="/teacher" replace />}
      </Route>
      <Route path="/teacher/reports/classes/:classId">
        {params => <AppLayout sidebarMode="hidden"><TeacherClassReportPage classId={params.classId} /></AppLayout>}
      </Route>
      <Route path="/teacher/reports">
        {() => <AppLayout sidebarMode="hidden"><TeacherReportsOverviewPage /></AppLayout>}
      </Route>
      <Route path="/teacher/settings">
        {() => <AppLayout sidebarMode="hidden"><TeacherSettingsPlaceholder /></AppLayout>}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppRoutes />
          </WouterRouter>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

