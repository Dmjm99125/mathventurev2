import type {
  TeacherAddStudentDraft,
  TeacherAddStudentsResult,
} from './index.ts';

export type TeacherAddStudentsSource = 'manual' | 'xlsx' | 'json';

export type TeacherAddStudentsFlowState = {
  step: 'source' | 'entry' | 'review' | 'result';
  source: TeacherAddStudentsSource | null;
  rows: TeacherAddStudentDraft[];
  result: TeacherAddStudentsResult | null;
};

export type TeacherAddStudentsFlowAction =
  | { type: 'reset' }
  | { type: 'source.selected'; source: TeacherAddStudentsSource }
  | { type: 'rows.prepared'; rows: TeacherAddStudentDraft[] }
  | { type: 'review.back' }
  | { type: 'submission.succeeded'; result: TeacherAddStudentsResult };

export function createInitialTeacherAddStudentsFlowState(): TeacherAddStudentsFlowState {
  return {
    step: 'source',
    source: null,
    rows: [],
    result: null,
  };
}

export function teacherAddStudentsFlowReducer(
  state: TeacherAddStudentsFlowState,
  action: TeacherAddStudentsFlowAction,
): TeacherAddStudentsFlowState {
  switch (action.type) {
    case 'reset':
      return createInitialTeacherAddStudentsFlowState();
    case 'source.selected':
      return {
        step: 'entry',
        source: action.source,
        rows: [],
        result: null,
      };
    case 'rows.prepared':
      return {
        ...state,
        step: 'review',
        rows: action.rows,
      };
    case 'review.back':
      return {
        ...state,
        step: 'entry',
      };
    case 'submission.succeeded':
      return {
        ...state,
        step: 'result',
        result: action.result,
      };
  }
}
