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

Deno.test("sequencing lesson uses Alpabasa video attribution", () => {
  assertEquals(lessonContent.sequencing.videoSrc, "/assets/videos/alpabasa.mp4");
  assertEquals(lessonContent.sequencing.videoTitle, "Awit ng Alpabasa");
  assertEquals(
    lessonContent.sequencing.videoCredit,
    "Original Musical Arrangement and Recording by Lester Delgado\nLyrics by Aina Valencia and Tisha Cruz\nSung by Eliza Tiongson\nStarring Alexa G. Cruz\n\nVisit www.alpabasa.com to learn more about the Alpabasa Reading Program.",
  );
});

Deno.test("addition lesson uses all supplied example replacements", () => {
  const images = lessonContent.addition.slides.map((slide) => slide.image).filter(Boolean);
  for (const replacement of [
    "add-replacement-1.png",
    "add-replacement-2.png",
    "add-replacement-3.png",
    "add-replacement-4.png",
    "add-replacement-5.png",
    "add-replacement-6.png",
  ]) {
    assertEquals(images.includes(replacement), true);
  }
  for (const kept of ["411.png", "412.png", "413.png", "414.png", "415.png", "416.png", "417.png", "418.png", "419.png", "420.png"]) {
    assertEquals(images.includes(kept), true);
  }
});

Deno.test("shapes lesson uses every supplied replacement example", () => {
  const slides = lessonContent.shapes.slides;
  assertEquals(slides.map((slide) => slide.image), [
    "shape-replacement-1.png", "shape-replacement-2.png", "shape-replacement-3.png",
    "shape-replacement-4.png", "shape-replacement-5.png",
  ]);
  assertEquals(slides.every((slide) => slide.audioEn && slide.audioFil), true);
});

Deno.test("subtraction lesson uses the supplied replacements for examples 2, 3, 5, 7, 8, and 10", () => {
  const slides = lessonContent.subtraction.slides;
  const images = slides.map((slide) => slide.image).filter(Boolean);
  for (const replacement of ["sub-replacement-1.png", "sub-replacement-2.png", "sub-replacement-3.png", "sub-replacement-4.png", "sub-replacement-5.png", "sub-replacement-6.png"]) {
    assertEquals(images.includes(replacement), true);
  }
  for (const kept of ["5pa.png", "5pd.png", "5f.jpg", "5g.jpg", "5i.jpg", "5k.jpg", "sub-replacement-6.png"]) {
    assertEquals(images.includes(kept), true);
  }
});
