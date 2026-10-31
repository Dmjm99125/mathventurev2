import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthContext, useAuth, type AuthContextType } from './context';

const value: AuthContextType = {
  user: null,
  teacherUser: null,
  viewingStudent: null,
  isViewingStudent: false,
  isLoading: false,
  refreshProfile: async () => {},
  viewStudentAccount: async () => {},
  returnToTeacherAccount: async () => {},
  offlineSignIn: async () => {},
};

describe('auth context boundary', () => {
  it('preserves the context value contract for consumers', () => {
    const result = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
      ),
    });

    expect(result.result.current).toBe(value);
  });
});
