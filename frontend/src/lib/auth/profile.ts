export type UserProfile = {
  id: string;
  role: 'student' | 'teacher';
  full_name: string;
};

export type AuthSessionLike = {
  user: {
    id: string;
    user_metadata?: Record<string, unknown> | null;
  };
} | null;

export function profileFromAuthSession(session: AuthSessionLike): UserProfile | null {
  if (!session) return null;

  return {
    id: session.user.id,
    role: session.user.user_metadata?.role === 'teacher' ? 'teacher' : 'student',
    full_name: typeof session.user.user_metadata?.full_name === 'string'
      ? session.user.user_metadata.full_name
      : '',
  };
}
