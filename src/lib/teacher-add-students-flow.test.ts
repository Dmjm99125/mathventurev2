import { assertEquals } from "jsr:@std/assert";
import {
  createInitialTeacherAddStudentsFlowState,
  teacherAddStudentsFlowReducer,
} from "./teacher-add-students-flow.ts";

Deno.test("teacher add-students flow selects a source and moves to entry", () => {
  const next = teacherAddStudentsFlowReducer(
    createInitialTeacherAddStudentsFlowState(),
    { type: "source.selected", source: "manual" },
  );

  assertEquals(next, {
    step: "entry",
    source: "manual",
    rows: [],
    result: null,
  });
});

Deno.test("teacher add-students flow moves from entry to review and result", () => {
  const entry = teacherAddStudentsFlowReducer(
    createInitialTeacherAddStudentsFlowState(),
    { type: "source.selected", source: "json" },
  );
  const review = teacherAddStudentsFlowReducer(entry, {
    type: "rows.prepared",
    rows: [{ lastName: "Santos", firstName: "Maria" }],
  });
  const result = teacherAddStudentsFlowReducer(review, {
    type: "submission.succeeded",
    result: {
      classId: "class-1",
      className: "Class A",
      createdCount: 1,
    },
  });

  assertEquals(review.step, "review");
  assertEquals(result.step, "result");
  assertEquals(result.result?.createdCount, 1);
});

Deno.test("teacher add-students flow returns to the chosen entry step with rows preserved", () => {
  const review = teacherAddStudentsFlowReducer(
    teacherAddStudentsFlowReducer(
      createInitialTeacherAddStudentsFlowState(),
      { type: "source.selected", source: "xlsx" },
    ),
    {
      type: "rows.prepared",
      rows: [{ lastName: "Cruz", firstName: "Paolo" }],
    },
  );

  const entryAgain = teacherAddStudentsFlowReducer(review, {
    type: "review.back",
  });

  assertEquals(entryAgain, {
    step: "entry",
    source: "xlsx",
    rows: [{ lastName: "Cruz", firstName: "Paolo" }],
    result: null,
  });
});
