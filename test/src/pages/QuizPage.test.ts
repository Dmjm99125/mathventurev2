import { assertEquals } from "jsr:@std/assert";

Deno.test("lesson intro video removes the skip button and uses larger sizing", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("Skip Video"), false);
  assertEquals(source.includes("max-w-5xl"), true);
  assertEquals(source.includes("maxHeight: '520px'"), true);
  assertEquals(source.includes("text-3xl font-display font-extrabold text-foreground text-center"), true);
});

Deno.test("lesson slide navigation uses a responsive mobile grid with a separate dot row", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"), true);
  assertEquals(source.includes("col-span-2 flex flex-wrap items-center justify-center gap-1.5 sm:col-span-1 sm:col-start-2"), true);
  assertEquals(source.includes("w-full min-w-0 gap-2 font-bold sm:col-start-1 sm:row-start-1 sm:w-auto"), true);
  assertEquals(source.includes("w-full min-w-0 gap-2 font-bold sm:col-start-3 sm:row-start-1 sm:w-auto"), true);
});

Deno.test("colors quiz includes multiple choice as its seventh activity", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("Array(topicGameCount).fill({})"), true);
  assertEquals(source.includes("topic === 'colors' && currentIndex === 6"), true);
  assertEquals(source.includes("<MultipleChoice"), true);
});

Deno.test("assigned lessons identify classroom quiz mode and use assignment quiz persistence", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("CLASSROOM QUIZ"), true);
  assertEquals(source.includes("ONE ATTEMPT ONLY"), true);
  assertEquals(source.includes("useAssignmentQuiz"), true);
  assertEquals(source.includes("useCheckpointAssignmentQuiz"), true);
  assertEquals(source.includes("useCompleteAssignmentQuiz"), true);
});

Deno.test("assigned completion removes replay while free play keeps the existing replay action", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("assignmentId ? null :"), true);
  assertEquals(source.includes("Quiz submitted — this assignment can only be taken once."), true);
  assertEquals(source.includes("submitAttempt.mutateAsync"), true);
});

Deno.test("every quiz game uses the checkpointed completion path and excludes drawing activities", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("onComplete={handleStructuredGameComplete}"), true);
  assertEquals(source.includes("DrawingCanvas"), false);
  assertEquals(source.includes("import { DrawingCanvas"), false);
  assertEquals(source.includes("if (isSavingGameRef.current) return;"), true);
  assertEquals(source.includes("setIsSavingGame(true)"), true);
});

Deno.test("drawing activities submit an explicit scored result", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/components/shared/DrawingCanvas.tsx", import.meta.url));

  assertEquals(source.includes("onComplete?: (score?: number, maxScore?: number) => void"), true);
  assertEquals(source.includes("onComplete?.(1, 1)"), true);
});

Deno.test("assigned games disable every child bypass navigation control", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("<AssignedQuizGameNavigation allowSkip={!isAssignedQuiz}>"), true);
  assertEquals(source.includes("React.cloneElement(child as React.ReactElement"), true);
});

Deno.test("all assigned-quiz games guard direct bypass callbacks", async () => {
  const pageSource = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));
  const imports = [...pageSource.matchAll(/from ['"](@\/components\/(?:games|shared)\/[^'"]+)['"]/g)]
    .map((match) => match[1]);

  for (const importPath of imports) {
    const filePath = new URL(`../../../src/${importPath.replace(/^@\//, '')}.tsx`, import.meta.url);
    const gameSource = await Deno.readTextFile(filePath);
    const hasBypassControl = /onClick=\{onComplete\}|onClick=\{handleFinish\}/.test(gameSource)
      && /Next Game|Skip Game|Skip to End|Finish Chapter|Finish Module/.test(gameSource);

    if (hasBypassControl) {
      assertEquals(gameSource.includes("allowSkip"), true, importPath);
    }
  }
});

Deno.test("structured quiz totals use the detailed game maxima", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const handleStructuredGameComplete = (gameScore = 1, gameMaxScore = 1)"), true);
  assertEquals(source.includes("const maxScore = nextResults.reduce((sum, result) => sum + result.maxScore, 0);"), true);
  assertEquals(source.includes("out of ${maxScore}"), true);
});
Deno.test("quiz completion does not show success when the final save fails", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("const didSave = await finishAttempt(nextResults, finalScore);"), true);
  assertEquals(source.includes("if (!didSave) return;"), true);
  assertEquals(source.includes("setGameState('completed');\n      confetti"), true);
});
