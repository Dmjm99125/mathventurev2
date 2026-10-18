import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button, Input, Label } from '@/components/ui';
import type { TeacherClassSummary } from '@/lib/api';

export function TeacherClassManagementDialog({
  open,
  mode,
  classroom,
  pending = false,
  error = null,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: 'create' | 'rename';
  classroom?: TeacherClassSummary | null;
  pending?: boolean;
  error?: string | null;
  onOpenChange(open: boolean): void;
  onSubmit(name: string): void;
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName(mode === 'rename' ? classroom?.name ?? '' : '');
  }, [classroom?.name, mode, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create a class' : 'Rename class'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Create a new class for this teacher account.' : 'Only the class name will change.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(name.trim()); }} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="teacher-class-name">Class name</Label>
            <Input id="teacher-class-name" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} autoFocus required />
          </div>
          {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="jungle" disabled={pending || !name.trim()}>
              {pending ? 'Saving...' : mode === 'create' ? 'Create class' : 'Save name'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
