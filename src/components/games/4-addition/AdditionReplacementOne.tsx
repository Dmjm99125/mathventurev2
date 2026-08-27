import { AdditionReplacementGame } from './AdditionReplacementGame';
export function AdditionReplacementOne({ onComplete, allowSkip = true }: { onComplete?: () => void; allowSkip?: boolean }) {
  return <AdditionReplacementGame onComplete={onComplete} allowSkip={allowSkip} theme={{ title: 'Addition Adventure', subtitle: 'Count the apples and add!', icon: '🍎', promptIcon: '🍎🍎', optionIcons: ['🍎', '🍏', '🍎'], colors: { panel: 'bg-rose-50', border: 'border-rose-300', accent: 'text-rose-600', button: 'bg-rose-500 hover:bg-rose-600' } }} />;
}
