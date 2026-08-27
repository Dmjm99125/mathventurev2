import { AdditionReplacementGame } from './AdditionReplacementGame';
export function AdditionReplacementThree({ onComplete, allowSkip = true }: { onComplete?: (score?: number, maxScore?: number) => void; allowSkip?: boolean }) {
  return <AdditionReplacementGame onComplete={onComplete} allowSkip={allowSkip} theme={{ title: 'Star Math', subtitle: 'Count and add the stars!', icon: '⭐', promptIcon: '⭐ ⭐', optionIcons: ['⭐', '🌟', '✨'], colors: { panel: 'bg-amber-50', border: 'border-amber-300', accent: 'text-amber-600', button: 'bg-amber-500 hover:bg-amber-600' } }} />;
}
