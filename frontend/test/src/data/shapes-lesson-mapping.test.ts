import { assertEquals } from "jsr:@std/assert";
import { lessonContent } from "../../../src/data/lessonContent.ts";

Deno.test("shapes lesson keeps replacement assets aligned with their labels", () => {
  const shapesSlides = lessonContent.shapes.slides;
  const squareSlide = shapesSlides.find((slide) => slide.id === "s-square");

  assertEquals(squareSlide?.labelEn, "Square");
  assertEquals(squareSlide?.labelFil, "Parisukat");
  assertEquals(squareSlide?.image, "shape-replacement-3.png");
  assertEquals(squareSlide?.audioEn, "/assets/audio/audio/2sq.mp3");
  assertEquals(shapesSlides.some((slide) => slide.id === "s-star"), false);
});
