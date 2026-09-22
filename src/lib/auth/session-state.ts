import type { UserProfile } from './profile';

export type AuthViewState = {
  user: UserProfile | null;
  teacherUser: UserProfile | null;
  viewingStudent: UserProfile | null;
  isViewingStudent: boolean;
};

export function isAuthReadyForData(
  isLoading: boolean,
  user: { id: string } | null,
): boolean {
  return !isLoading && user !== null;
}

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
