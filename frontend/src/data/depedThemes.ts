import type { TeacherTopicId } from "@/lib/games/catalog";

export interface DepEdThemeRow {
  field: string;
  content: string;
}

export interface DepEdTheme {
  title: string;
  rows: readonly DepEdThemeRow[];
}

export const DEPED_THEMES: Record<TeacherTopicId, DepEdTheme> = {
  colors: {
    title: "Colors",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand the value of knowing oneself, one’s physical features, and surroundings." },
      { field: "PERFORMANCE STANDARD", content: "The learners demonstrate basic concepts of sorting and identifying visual attributes in their immediate environment." },
      { field: "LEARNING COMPETENCIES", content: "Identify, group, and sort concrete objects according to color (primary and secondary colors)." },
      { field: "SUBTHEMES", content: "1. I am unique (My body, my clothes, and things around me)." },
      { field: "SUGGESTED CONTENTS", content: "Identifying and Sorting Colors (Red, Blue, Yellow, Green, Orange, Purple, Black, White)" },
    ],
  },
  shapes: {
    title: "Shapes",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand the physical characteristics and shapes of common objects in the school and home." },
      { field: "PERFORMANCE STANDARD", content: "The learners identify, sort, and construct two-dimensional (2D) shapes using manipulative materials." },
      { field: "LEARNING COMPETENCIES", content: "Identify and describe common two-dimensional shapes (circle, triangle, square, rectangle)." },
      { field: "SUBTHEMES", content: "2. My family and the things we see in our home." },
      { field: "SUGGESTED CONTENTS", content: "2D Shapes in the Environment (Circle, Square, Triangle, Rectangle)" },
    ],
  },
  sequencing: {
    title: "Sequencing",
    rows: [
      { field: "THEME II", content: "EXPLORING OUR COMMUNITY" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of order, logical progression, and patterns in daily routines." },
      { field: "PERFORMANCE STANDARD", content: "The learners arrange events and patterns in logical sequential order." },
      { field: "LEARNING COMPETENCIES", content: "Sequence events with 3 to 4 steps (e.g., daily routines, stories, or growth stages); identify and complete repeating patterns." },
      { field: "SUBTHEMES", content: "2. Daily routines in our community and school." },
      { field: "SUGGESTED CONTENTS", content: "Event Sequencing (First, Next, Last) and Repeating Patterns (AB, AAB)" },
    ],
  },
  addition: {
    title: "Addition",
    rows: [
      { field: "THEME III", content: "DISCOVERING OUR SURROUNDINGS" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of combining sets and the meaning of addition." },
      { field: "PERFORMANCE STANDARD", content: "The learners perform simple addition involving concrete objects with sums up to 10." },
      { field: "LEARNING COMPETENCIES", content: "Combine two sets of concrete objects to find the total sum (up to 10)." },
      { field: "SUBTHEMES", content: "1. Living things and gathering objects in nature." },
      { field: "SUGGESTED CONTENTS", content: "Joining Sets and Basic Addition (Concrete and Pictorial Models up to 10)" },
    ],
  },
  subtraction: {
    title: "Subtraction",
    rows: [
      { field: "THEME III", content: "DISCOVERING OUR SURROUNDINGS" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of taking away elements from a set and the meaning of subtraction." },
      { field: "PERFORMANCE STANDARD", content: "The learners perform simple subtraction using manipulatives and visual representations within 10." },
      { field: "LEARNING COMPETENCIES", content: "Take away a specific quantity from a given set of objects to find how many are left (within 10)." },
      { field: "SUBTHEMES", content: "2. Caring for animals and sharing natural resources." },
      { field: "SUGGESTED CONTENTS", content: "Separating Sets and Basic Subtraction (Taking Away within 10)" },
    ],
  },
  numbers: {
    title: "Numbers",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand numeral identification, one-to-one correspondence, and cardinal values from 1 to 20." },
      { field: "PERFORMANCE STANDARD", content: "The learners count, recognize, write, and represent quantities up to 20 accurately." },
      { field: "LEARNING COMPETENCIES", content: "Count objects with one-to-one correspondence; read and write numerals 1 to 20; recognize quantity representations." },
      { field: "SUBTHEMES", content: "3. Counting members and objects in our household." },
      { field: "SUGGESTED CONTENTS", content: "Cardinal Numbers 1 to 20, Counting Songs, and Number Representation" },
    ],
  },
  measurement: {
    title: "Measurement",
    rows: [
      { field: "THEME IV", content: "CARING FOR OUR WORLD" },
      { field: "CONTENT STANDARD", content: "The learners understand the concept of comparing and measuring attributes using non-standard tools." },
      { field: "PERFORMANCE STANDARD", content: "The learners measure and estimate length, mass, and capacity using non-standard units (paper clips, blocks, hand spans)." },
      { field: "LEARNING COMPETENCIES", content: "Measure and compare objects using non-standard measurement tools (e.g., longer/shorter, heavier/lighter, holds more/holds less)." },
      { field: "SUBTHEMES", content: "2. Exploring materials and resources in our environment." },
      { field: "SUGGESTED CONTENTS", content: "Non-Standard Measurement (Length, Height, Weight, and Capacity)" },
    ],
  },
  comparison: {
    title: "Comparison",
    rows: [
      { field: "THEME I", content: "KNOWING WHO WE ARE AND OUR FAMILIES" },
      { field: "CONTENT STANDARD", content: "The learners understand relative attributes and relationships between two or more physical objects." },
      { field: "PERFORMANCE STANDARD", content: "The learners compare and sort objects based on measurable size, length, and quantity." },
      { field: "LEARNING COMPETENCIES", content: "Compare objects using comparative terms: big/small, long/short, tall/short, heavy/light, more/less/equal." },
      { field: "SUBTHEMES", content: "1. Observing physical traits and everyday objects." },
      { field: "SUGGESTED CONTENTS", content: "Comparative Concepts (Big/Small, Long/Short, Tall/Short, More/Less/Equal)" },
    ],
  },
  clock: {
    title: "Clock",
    rows: [
      { field: "THEME II", content: "EXPLORING OUR COMMUNITY" },
      { field: "CONTENT STANDARD", content: "The learners understand basic concepts of time, parts of the day, and tell time by the hour on an analog clock." },
      { field: "PERFORMANCE STANDARD", content: "The learners tell time to the hour and associate specific times with school and daily community activities." },
      { field: "LEARNING COMPETENCIES", content: "Tell and show time by the hour using an analog clock; identify times associated with daily routines (morning, noon, night)." },
      { field: "SUBTHEMES", content: "1. A day in our community (Schedules and helpers)." },
      { field: "SUGGESTED CONTENTS", content: "Telling Time by the Hour (Analog Clock Faces and Daily Schedules)" },
    ],
  },
};
