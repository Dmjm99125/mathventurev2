export function shouldRecordStandaloneAttempt({
  isPublicFreePlay,
  isTeacherContext,
}: {
  isPublicFreePlay: boolean;
  isTeacherContext: boolean;
}): boolean {
  return !isPublicFreePlay && !isTeacherContext;
}
