import { createContext, useContext } from 'react';
import type { UserProfile } from '@/lib/auth/profile';

export type AuthContextType = {
  user: UserProfile | null;
  teacherUser: UserProfile | null;
  viewingStudent: UserProfile | null;
  isViewingStudent: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  viewStudentAccount: (studentId: string) => Promise<void>;
  returnToTeacherAccount: (password: string) => Promise<void>;
  offlineSignIn: (password: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  teacherUser: null,
  viewingStudent: null,
  isViewingStudent: false,
  isLoading: true,
  refreshProfile: async () => {},
  viewStudentAccount: async () => {},
  returnToTeacherAccount: async () => {},
  offlineSignIn: async () => {},
});

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
