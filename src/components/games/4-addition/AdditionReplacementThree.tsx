import { AdditionReplacementGame } from './AdditionReplacementGame';
export function AdditionReplacementThree({ onComplete }: { onComplete?: () => void }) {
  return <AdditionReplacementGame onComplete={onComplete} theme={{ title: 'Star Math', subtitle: 'Count and add the stars!', icon: '⭐', promptIcon: '⭐ ⭐', optionIcons: ['⭐', '🌟', '✨'], colors: { panel: 'bg-amber-50', border: 'border-amber-300', accent: 'text-amber-600', button: 'bg-amber-500 hover:bg-amber-600' } }} />;
}
