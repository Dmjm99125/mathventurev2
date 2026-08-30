import { assertEquals } from "jsr:@std/assert";

const source = await Deno.readTextFile(new URL("../../../src/components/teacher/TeacherAssignedQuizzes.tsx", import.meta.url));

Deno.test("assigned quizzes exposes nested score drill-down", () => {
  for (const required of [
    "expandedAssignmentId", "expandedStudentId", "aria-expanded", "View games",
    "GAME_CATALOG", "GAME_CATALOG.filter((game) => game.topicId === assignment.lessonId)",
    "Assigned", "Due", "Try again", "No quizzes have been assigned",
  ]) {
    assertEquals(source.includes(required), true, `missing ${required}`);
  }
});
