import { assertEquals } from "jsr:@std/assert";
import { lessonContent } from "../../../src/data/lessonContent.ts";

Deno.test("shapes lesson keeps square and star assets aligned with their labels", () => {
  const shapesSlides = lessonContent.shapes.slides;
  const squareSlide = shapesSlides.find((slide) => slide.id === "s-square");
  const starSlide = shapesSlides.find((slide) => slide.id === "s-star");

  assertEquals(squareSlide?.labelEn, "Square");
  assertEquals(squareSlide?.labelFil, "Parisukat");
  assertEquals(squareSlide?.image, "2sq.png");
  assertEquals(squareSlide?.audioEn, "/assets/audio/audio/2sq.mp3");

  assertEquals(starSlide?.labelEn, "Star");
  assertEquals(starSlide?.labelFil, "Bituin");
  assertEquals(starSlide?.image, "2s.png");
  assertEquals(starSlide?.audioEn, "/assets/audio/audio/2s.mp3");
});
