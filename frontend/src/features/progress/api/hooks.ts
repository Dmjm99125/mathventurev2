import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useOfflineClassroom } from '@/lib/offline/classroom/useOfflineClassroom';
import { recordFreePlayCompletion } from '@/lib/offline/classroom/freePlay';

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
