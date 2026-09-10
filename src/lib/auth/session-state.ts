import type { UserProfile } from './profile';

export type AuthViewState = {
  user: UserProfile | null;
  teacherUser: UserProfile | null;
  viewingStudent: UserProfile | null;
  isViewingStudent: boolean;
};

export function buildAuthViewState(
  teacherUser: UserProfile | null,
  viewingStudent: UserProfile | null,
): AuthViewState {
  return {
    user: viewingStudent ?? teacherUser,
    teacherUser,
    viewingStudent,
    isViewingStudent: viewingStudent !== null,
  };
}
