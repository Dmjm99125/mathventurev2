import { AdditionReplacementGame } from './AdditionReplacementGame';
export function AdditionReplacementFour({ onComplete, allowSkip = true }: { onComplete?: (score?: number, maxScore?: number) => void; allowSkip?: boolean }) {
  return <AdditionReplacementGame onComplete={onComplete} allowSkip={allowSkip} theme={{ title: 'Rainbow Addition Garden', subtitle: 'Help the garden grow with addition!', icon: '🌈', promptIcon: '🌸 🌼', optionIcons: ['🌸', '🌼', '🌷'], colors: { panel: 'bg-emerald-50', border: 'border-emerald-300', accent: 'text-emerald-600', button: 'bg-emerald-500 hover:bg-emerald-600' } }} />;
}
