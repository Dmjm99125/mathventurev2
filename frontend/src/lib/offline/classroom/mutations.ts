import type { OfflineRepository } from './repository.ts';

export type PendingMutationResult = {
  id: string;
  syncState: 'pending';
};

function makeId(idFactory?: () => string): string {
  return idFactory?.() ?? crypto.randomUUID();
}

export async function createOfflineAssignment(
  repository: OfflineRepository,
  actorId: string,
  input: { lessonId: string; name?: string; classId?: string; studentId?: string; dueAt?: string | null },
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  await repository.applyMutation({
    actorId,
    type: 'assignment.create',
    entityId: id,
    payload: { id, ...input },
    dependencies: [],
  });
  return { id, syncState: 'pending' };
}

export async function updateOfflineAssignment(
  repository: OfflineRepository,
  actorId: string,
  input: { assignmentId: string; lessonId: string; name?: string; dueAt?: string | null },
  dependencies: string[] = [],
): Promise<PendingMutationResult> {
  await repository.applyMutation({
    actorId,
    type: 'assignment.update',
    entityId: input.assignmentId,
    payload: { ...input, id: input.assignmentId },
    dependencies,
  });
  return { id: input.assignmentId, syncState: 'pending' };
}

export async function deleteOfflineAssignment(
  repository: OfflineRepository,
  actorId: string,
  assignmentId: string,
): Promise<PendingMutationResult> {
  await repository.applyMutation({
    actorId,
    type: 'assignment.delete',
    entityId: assignmentId,
    payload: { assignmentId },
    dependencies: [],
  });
  return { id: assignmentId, syncState: 'pending' };
}

export async function addOfflineStudents(
  repository: OfflineRepository,
  actorId: string,
  students: Array<{ firstName: string; lastName: string }>,
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  await repository.applyMutation({
    actorId,
    type: 'class.addStudents',
    entityId: id,
    payload: { students },
    dependencies: [],
  });
  return { id, syncState: 'pending' };
}

export async function removeOfflineStudent(
  repository: OfflineRepository,
  actorId: string,
  studentId: string,
): Promise<PendingMutationResult> {
  await repository.applyMutation({
    actorId,
    type: 'class.removeStudent',
    entityId: studentId,
    payload: { studentId },
    dependencies: [],
  });
  return { id: studentId, syncState: 'pending' };
}

export async function createOfflinePost(
  repository: OfflineRepository,
  actorId: string,
  input: { classId: string; content: string },
  idFactory?: () => string,
): Promise<PendingMutationResult> {
  const id = makeId(idFactory);
  await repository.applyMutation({
    actorId,
    type: 'post.create',
    entityId: id,
    payload: { id, ...input, authorId: actorId },
    dependencies: [],
  });
  return { id, syncState: 'pending' };
}
