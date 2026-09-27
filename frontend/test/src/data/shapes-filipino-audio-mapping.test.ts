import { assertEquals } from "jsr:@std/assert";
import { lessonContent } from "../../../src/data/lessonContent.ts";

Deno.test("shapes lesson keeps replacement labels and Filipino audio aligned", () => {
  const shapesSlides = lessonContent.shapes.slides;
  const ovalSlide = shapesSlides.find((slide) => slide.id === "s-oval");

  assertEquals(ovalSlide?.labelFil, "Habilog o Obalo");
  assertEquals(ovalSlide?.audioFil, "/assets/audio/audio/2hab.MP3");
  assertEquals(shapesSlides.some((slide) => slide.id === "s-heart"), false);
});
