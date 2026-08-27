import { NumberReplacementGame } from './NumberReplacementGame';

interface NumberReplacementHungryMonsterProps {
  onComplete?: () => void;
  allowSkip?: boolean;
}

export function NumberReplacementHungryMonster({ onComplete, allowSkip = true }: NumberReplacementHungryMonsterProps) {
  return (
    <NumberReplacementGame
      onComplete={onComplete}
      allowSkip={allowSkip}
      theme={{
        title: 'Feed the Hungry Monster',
        subtitle: 'Give the monster the right number of snacks!',
        icon: '👾',
        item: '🍪',
        answerLabel: 'How many snacks does the monster need?',
        colors: { panel: 'bg-purple-50', border: 'border-purple-300', button: 'bg-purple-500 hover:bg-purple-600' },
      }}
    />
  );
}
