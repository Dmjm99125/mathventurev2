import { NumberReplacementGame } from './NumberReplacementGame';

interface NumberReplacementAnimalPopProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function NumberReplacementAnimalPop({ onComplete, allowSkip = true }: NumberReplacementAnimalPopProps) {
  return (
    <NumberReplacementGame
      onComplete={onComplete}
      allowSkip={allowSkip}
      theme={{
        title: 'Animal Pop',
        subtitle: 'Count the animal friends!',
        icon: '🐾',
        item: '🐶',
        answerLabel: 'How many friends do you see?',
        colors: { panel: 'bg-orange-50', border: 'border-orange-300', button: 'bg-orange-500 hover:bg-orange-600' },
      }}
    />
  );
}
