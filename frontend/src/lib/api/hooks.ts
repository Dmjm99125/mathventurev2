import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth';
import { isAuthReadyForData } from '../auth/session-state';
import { api } from './client';
import { useOfflineClassroom } from '../offline/classroom/useOfflineClassroom';
import { createOfflinePost } from '../offline/classroom/mutations';
import { readOfflinePosts } from '../offline/classroom/reports';
import { recordFreePlayCompletion } from '../offline/classroom/freePlay';
import { postKeys } from '@infrastructure/api/queryKeys';

export * from '@features/classroom/api/hooks';
export * from '@features/dashboard/api/hooks';
export * from '@features/reports/api/hooks';
export * from '@features/assignments/api/hooks';

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

export function useClassPosts(classId: string) {
  const { user, isLoading } = useAuth();
  const { repository } = useOfflineClassroom();

  return useQuery({
    queryKey: postKeys.list(classId),
    queryFn: async () => {
      const posts = await readOfflinePosts(repository, classId);
      if (posts.length || browserIsOffline()) return { posts };
      return api.posts.list(classId);
    },
    enabled: !!classId && isAuthReadyForData(isLoading, user),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { repository, syncNow } = useOfflineClassroom();
  return useMutation({
    mutationFn: async ({ classId, content }: { classId: string, content: string }) => {
      if (user) {
        const result = await createOfflinePost(repository, user.id, { classId, content });
        if (!browserIsOffline()) void syncNow();
        return { post: { id: result.id, classId, content }, syncState: result.syncState };
      }
      return api.posts.create(classId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(variables.classId) });
    },
  });
}
