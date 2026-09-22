export interface Question {
  id: string;
  prompt: string;
  options: { image: string; isCorrect: boolean; target: string }[];
  correctFeedback: string;
  wrongFeedback: string;
}
