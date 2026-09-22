import { AdditionReplacementGame } from './AdditionReplacementGame';
export function AdditionReplacementTwo({ onComplete, allowSkip = true }: { onComplete?: (score?: number, maxScore?: number) => void; allowSkip?: boolean }) {
  return <AdditionReplacementGame onComplete={onComplete} allowSkip={allowSkip} theme={{ title: 'Dice Addition Adventure', subtitle: 'Roll, count, and add!', icon: '🎲', promptIcon: '🎲 ➕ 🎲', optionIcons: ['🎲', '🎯', '🎲'], colors: { panel: 'bg-sky-50', border: 'border-sky-300', accent: 'text-sky-600', button: 'bg-sky-500 hover:bg-sky-600' } }} />;
}
