import { NumberReplacementGame } from './NumberReplacementGame';

interface NumberReplacementWhackMoleProps {
  onComplete?: (score?: number, maxScore?: number) => void;
  allowSkip?: boolean;
}

export function NumberReplacementWhackMole({ onComplete, allowSkip = true }: NumberReplacementWhackMoleProps) {
  return (
    <NumberReplacementGame
      onComplete={onComplete}
      allowSkip={allowSkip}
      theme={{
        title: 'Whack-a-Mole',
        subtitle: 'Count the circles and choose the matching number!',
        icon: '🔨',
        item: '🔵',
        answerLabel: 'Which mole has this number?',
        colors: { panel: 'bg-green-50', border: 'border-green-300', button: 'bg-green-600 hover:bg-green-700' },
      }}
    />
  );
}
