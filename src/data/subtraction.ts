import type { Question } from './question';

export const subtractionData: Question[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `sub_custom_${i}`,
  prompt: 'Custom Subtraction Game',
  options: [],
  correctFeedback: '',
  wrongFeedback: ''
}));
