import { AdditionReplacementGame } from './AdditionReplacementGame';
export function AdditionReplacementOne({ onComplete }: { onComplete?: () => void }) {
  return <AdditionReplacementGame onComplete={onComplete} theme={{ title: 'Addition Adventure', subtitle: 'Count the apples and add!', icon: '🍎', promptIcon: '🍎🍎', optionIcons: ['🍎', '🍏', '🍎'], colors: { panel: 'bg-rose-50', border: 'border-rose-300', accent: 'text-rose-600', button: 'bg-rose-500 hover:bg-rose-600' } }} />;
}
