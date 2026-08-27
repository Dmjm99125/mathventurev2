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

Deno.test("colors quiz ends after the first multiple-choice activity", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("topic === 'colors' ? Array(6).fill({})"), true);
  assertEquals(source.includes("topic === 'colors' && currentIndex === 6"), false);
  assertEquals(source.includes("<MultipleChoice"), false);
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

Deno.test("assigned special games use the checkpointed completion path", async () => {
  const source = await Deno.readTextFile(new URL("../../../src/pages/QuizPage.tsx", import.meta.url));

  assertEquals(source.includes("onComplete={() => void completeStructuredGame(1, 1)}"), true);
  assertEquals(source.includes("if (isSavingGameRef.current) return;"), true);
  assertEquals(source.includes("setIsSavingGame(true)"), true);
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
