import { assert } from "jsr:@std/assert";

async function readSource(relativePath: string) {
  return await Deno.readTextFile(new URL(`../${relativePath}`, import.meta.url));
}

const fixedRoundGames = [
  "src/components/games/4-addition/AdditionReplacementGame.tsx",
];

const retryUntilCorrectGames = [
  "src/components/games/4-addition/AdditionFunGame.tsx",
  "src/components/games/4-addition/AppleAddition.tsx",
  "src/components/games/4-addition/FruitPopMath.tsx",
  "src/components/games/4-addition/AdditionAdventure.tsx",
  "src/components/games/4-addition/SecondAdditionRound.tsx",
  "src/components/games/4-addition/AnimalSafari.tsx",
  "src/components/games/4-addition/UnderTheSea.tsx",
  "src/components/games/4-addition/Carnival.tsx",
  "src/components/games/4-addition/IceCreamShop.tsx",
  "src/components/games/4-addition/Pizza.tsx",
  "src/components/games/4-addition/ComicStarCatcher.tsx",
];

const wrapperGames = [
  "src/components/games/4-addition/AdditionReplacementOne.tsx",
  "src/components/games/4-addition/AdditionReplacementTwo.tsx",
  "src/components/games/4-addition/AdditionReplacementThree.tsx",
  "src/components/games/4-addition/AdditionReplacementFour.tsx",
];

Deno.test("addition quiz games report scored terminal results without scoring skips", async () => {
  for (const path of [...fixedRoundGames, ...retryUntilCorrectGames, ...wrapperGames]) {
    const source = await readSource(path);
    assert(source.includes("onComplete?: (score?: number, maxScore?: number) => void"), `${path} accepts scored completion callbacks`);
    if (!wrapperGames.includes(path)) {
      assert(source.includes("onClick={() => onComplete?.()}"), `${path} keeps its no-argument skip/navigation callback`);
    }
  }

  const fixedRoundSource = await readSource(fixedRoundGames[0]);
  assert(fixedRoundSource.includes("onComplete?.(newScore, maxRounds)"), "fixed rounds report correct items out of all rounds");
  assert(fixedRoundSource.includes("onComplete?.(score, maxRounds)"), "fixed rounds report their result from the completion overlay");

  for (const path of retryUntilCorrectGames) {
    const source = await readSource(path);
    assert(source.includes("const [attempts, setAttempts] = useState(0)"), `${path} tracks answer attempts`);
    assert(source.includes("setAttempts(value => value + 1)"), `${path} counts wrong and correct answer attempts`);
    assert(source.includes("onComplete?.(newScore, newAttempts)"), `${path} reports attempts at automatic terminal completion`);
    assert(source.includes("onComplete?.(score, attempts)"), `${path} reports attempts from the completion overlay`);
  }

  const adventureSource = await readSource("src/components/games/4-addition/AdditionAdventure.tsx");
  const backButtonIndex = adventureSource.indexOf("<ArrowLeft className=\"mr-2 h-4 w-4\" /> Back");
  assert(
    backButtonIndex >= 0 &&
      adventureSource.lastIndexOf("{allowSkip !== false && (", backButtonIndex) >= 0,
    "AdditionAdventure does not expose Back during an assigned quiz",
  );

  for (const path of wrapperGames) {
    const source = await readSource(path);
    assert(source.includes("allowSkip={allowSkip}"), `${path} forwards assigned-mode completion rules`);
  }
});
