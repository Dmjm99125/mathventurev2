import { assertEquals } from "jsr:@std/assert";
import { lessonContent } from "../../../src/data/lessonContent.ts";

Deno.test("shapes lesson keeps oval and heart Filipino audio aligned", () => {
  const shapesSlides = lessonContent.shapes.slides;
  const ovalSlide = shapesSlides.find((slide) => slide.id === "s-oval");
  const heartSlide = shapesSlides.find((slide) => slide.id === "s-heart");

  assertEquals(ovalSlide?.labelFil, "Ovalado");
  assertEquals(ovalSlide?.audioFil, "/assets/audio/audio/2hab.MP3");

  assertEquals(heartSlide?.labelFil, "Puso");
  assertEquals(heartSlide?.audioFil, "/assets/audio/audio/2pu.MP3");
});
