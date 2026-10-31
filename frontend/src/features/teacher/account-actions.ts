import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';

export function useTeacherStudentAccountActions() {
  const { viewStudentAccount, viewingStudent } = useAuth();
  const [, setLocation] = useLocation();
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  const viewStudent = async (studentId: string) => {
    setViewError(null);
    setViewingStudentId(studentId);
    try {
      await viewStudentAccount(studentId);
      setLocation('/student');
    } catch (caught) {
      setViewError(
        caught instanceof Error
          ? caught.message
          : "We couldn't open that student account right now.",
      );
    } finally {
      setViewingStudentId(null);
    }
  };

  return {
    viewStudent,
    viewError,
    viewingStudent,
    viewingStudentId,
  };
}
