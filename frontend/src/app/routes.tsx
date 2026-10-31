import { Redirect, Route, Switch } from 'wouter';

import {
  About,
  ForgotPassword,
  Landing,
  Login,
  NotFound,
  PasswordReset,
  Signup,
} from '@features/public-site/pages';
import { FreePlay } from '@/pages/free-play';
import { QuizPage } from '@/pages/QuizPage';
import { StudentClassroomPage, StudentDashboard } from '@features/student/pages';
import {
  TeacherAssignmentsPage,
  TeacherClassesPage,
  TeacherClassWorkspacePage,
  TeacherReportsPage,
  TeacherSettingsPage,
  TeacherStudentsPage,
  TeacherTodayPage,
} from '@features/teacher/pages';
import { AppLayout } from '@/components/layout';

export function AppRoutes() {
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
