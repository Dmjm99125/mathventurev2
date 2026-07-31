import { assertEquals } from "jsr:@std/assert";
import { lessonContent } from "../../../src/data/lessonContent.ts";

const NUMBER_SEQUENCE_IMAGES = [
  "1n0.png",
  "1n1.png",
  "1n2.png",
  "1n3.png",
  "1n4.png",
  "1n5.png",
  "1n6.png",
  "1n7.png",
  "1n8.png",
  "1n9.png",
  "1n10.png",
];

const BEE_SIZE_IMAGES = [
  "sn1.png",
  "sn2.png",
  "sn3.png",
  "sn4.png",
  "sn5.png",
];

Deno.test("sequencing lesson keeps only the intended legacy intro sections", () => {
  const slides = lessonContent.sequencing.slides;

  assertEquals(
    slides.map((slide) => ({
      id: slide.id,
      image: slide.image ?? null,
      images: slide.images ?? [],
      groupedImageSizing: (slide as { groupedImageSizing?: string }).groupedImageSizing ?? null,
    })),
    [
      { id: "sq-count", image: null, images: NUMBER_SEQUENCE_IMAGES, groupedImageSizing: null },
      { id: "sq-alpha", image: "alp.png", images: [], groupedImageSizing: null },
      { id: "sq-size", image: null, images: BEE_SIZE_IMAGES, groupedImageSizing: "natural" },
      { id: "sq-pattern-1", image: "r.png", images: [], groupedImageSizing: null },
      { id: "sq-pattern-2", image: "r1.png", images: [], groupedImageSizing: null },
      { id: "sq-pattern-3", image: "r2.png", images: [], groupedImageSizing: null },
    ],
  );

  const referencedImages = slides.flatMap((slide) => slide.images ?? (slide.image ? [slide.image] : []));
  assertEquals(
    referencedImages.filter((image) =>
      ["1seq.png", "3s1.png", "1PB.png", "ACT.png"].includes(image)
    ),
    [],
  );
});
