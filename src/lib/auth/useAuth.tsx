import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { resetActiveAuthClient, setActiveAuthClient } from '../api';
import { supabase } from '../supabase/client';
import { studentSupabase } from '../supabase/student-client';
import {
  getProfile,
  returnToTeacherAccount as clearStudentAccount,
  viewStudentAccount as openStudentAccount,
} from './auth';
import { profileFromAuthSession, type UserProfile } from './profile';
import { buildAuthViewState } from './session-state';

export type AuthContextType = {
  user: UserProfile | null;
  teacherUser: UserProfile | null;
  viewingStudent: UserProfile | null;
  isViewingStudent: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  viewStudentAccount: (studentId: string) => Promise<void>;
  returnToTeacherAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  teacherUser: null,
  viewingStudent: null,
  isViewingStudent: false,
  isLoading: true,
  refreshProfile: async () => {},
  viewStudentAccount: async () => {},
  returnToTeacherAccount: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [teacherUser, setTeacherUser] = useState<UserProfile | null>(null);
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const [profile, studentSessionResult] = await Promise.all([
        getProfile(),
        studentSupabase.auth.getSession(),
      ]);
      const teacherProfile = profile?.role === 'teacher' ? profile : null;
      const studentProfile = profileFromAuthSession(studentSessionResult.data.session);
      setTeacherUser(teacherProfile);
      const activeStudent = teacherProfile && studentProfile?.role === 'student'
        ? studentProfile
        : null;
      if (activeStudent) {
        setActiveAuthClient(studentSupabase);
      } else {
        resetActiveAuthClient();
      }
      setViewingStudent(activeStudent);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setTeacherUser(null);
      setViewingStudent(null);
      resetActiveAuthClient();
    } finally {
      setIsLoading(false);
    }
  };

  const viewStudentAccount = async (studentId: string) => {
    const studentProfile = await openStudentAccount(studentId);
    queryClient.clear();
    setViewingStudent(studentProfile);
  };

  const returnToTeacherAccount = async () => {
    await clearStudentAccount();
    queryClient.clear();
    setViewingStudent(null);
  };

  useEffect(() => {
    void fetchProfile();

    const { data: { subscription: teacherSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Auth callbacks run while supabase-js holds its internal auth lock.
      // Do not call getSession(), getUser(), or any other async Supabase API
      // here; update from the session that the callback already provides.
      const profile = profileFromAuthSession(session);
      setTeacherUser(profile?.role === 'teacher' ? profile : null);
      if (!profile) {
        setViewingStudent(null);
        resetActiveAuthClient();
      }
      setIsLoading(false);
    });

    const { data: { subscription: studentSubscription } } = studentSupabase.auth.onAuthStateChange((_event, session) => {
      const profile = profileFromAuthSession(session);
      if (profile?.role === 'student') {
        setActiveAuthClient(studentSupabase);
        setViewingStudent(profile);
      } else {
        resetActiveAuthClient();
        setViewingStudent(null);
      }
    });

    return () => {
      teacherSubscription.unsubscribe();
      studentSubscription.unsubscribe();
    };
  }, [queryClient]);

  const viewState = buildAuthViewState(teacherUser, viewingStudent);

  return (
    <AuthContext.Provider value={{
      ...viewState,
      isLoading,
      refreshProfile: fetchProfile,
      viewStudentAccount,
      returnToTeacherAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
