import { useState } from 'react';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LEGACY_TOPIC_META } from '@/lib/student/portal';
import { useCreateAssignment } from '@/lib/api/hooks';

export function TeacherAssignQuizDialog({
  open,
  onOpenChange,
  classId,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  classId: string;
}) {
  const createAssignment = useCreateAssignment();
  const [lessonId, setLessonId] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  const close = () => {
    setLessonId('');
    setError('');
    setCreated(false);
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lessonId) return;

    setError('');
    try {
      await createAssignment.mutateAsync({ lessonId, classId });
      setCreated(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to assign this quiz.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Quiz</DialogTitle>
          <DialogDescription>
            Choose a topic to assign to every student in your classroom. Each student can take the quiz once.
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/10 p-4 font-bold text-primary">
            Quiz assigned successfully. Students will see it in their classroom quizzes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="assignment-topic" className="font-bold">Topic</label>
              <select
                id="assignment-topic"
                value={lessonId}
                onChange={(event) => setLessonId(event.target.value)}
                className="h-11 rounded-xl border-2 border-input bg-background px-3 font-bold"
                required
              >
                <option value="">Select a topic</option>
                {LEGACY_TOPIC_META.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.fallbackLabel}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm font-bold text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
              <Button type="submit" variant="jungle" disabled={createAssignment.isPending || !lessonId}>
                {createAssignment.isPending ? 'Assigning...' : 'Assign Quiz'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {created && (
          <DialogFooter>
            <Button type="button" variant="jungle" onClick={close}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
