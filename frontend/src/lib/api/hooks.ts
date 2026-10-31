import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { useOfflineClassroom } from '../offline/classroom/useOfflineClassroom';
import { recordFreePlayCompletion } from '../offline/classroom/freePlay';

export * from '@features/classroom/api/hooks';
export * from '@features/dashboard/api/hooks';
export * from '@features/reports/api/hooks';
export * from '@features/assignments/api/hooks';
export * from '@features/posts/api/hooks';

function browserIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function useRecordFreePlayCompletion() {
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async (input: { gameId: string; score: number; maxScore: number; completedAt?: string }) => {
      if (!user || user.role !== 'student') throw new Error('Free Play progress requires a student session.');
      const result = await recordFreePlayCompletion(repository, user.id, input);
      if (!browserIsOffline()) void syncNow();
      return result;
    },
  });
}

