import type { Question } from './question';

export const additionData: Question[] = Array.from({ length: 16 }).map((_, i) => ({
  id: `add_custom_${i}`,
  prompt: 'Custom Addition Game',
  options: [],
  correctFeedback: '',
  wrongFeedback: ''
}));
