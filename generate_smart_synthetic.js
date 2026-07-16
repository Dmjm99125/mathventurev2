import fs from 'fs';
import path from 'path';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helpers
function getNumImage(n) {
  return `6${n}.png`;
}

function getWrongNumbers(correctNum, count, max = 20) {
  const wrongs = new Set();
  while (wrongs.size < count) {
    const r = Math.floor(Math.random() * (max + 1));
    if (r !== correctNum) wrongs.add(r);
  }
  return Array.from(wrongs);
}

function generateOptionsForNumber(correctNum, max = 20) {
  const wrongs = getWrongNumbers(correctNum, 2, max);
  const opts = [
    { image: getNumImage(correctNum), isCorrect: true, target: "" },
    { image: getNumImage(wrongs[0]), isCorrect: false, target: "" },
    { image: getNumImage(wrongs[1]), isCorrect: false, target: "" }
  ];
  return shuffle(opts);
}

// 1. Numbers
const numbersData = [];
for (let i = 1; i <= 30; i++) {
  const target = Math.floor(Math.random() * 21); // 0 to 20
  numbersData.push({
    id: `numbers_${i}`,
    prompt: `Hanapin ang numerong ${target}`,
    options: generateOptionsForNumber(target, 20),
    correctFeedback: "",
    wrongFeedback: ""
  });
}

// 2. Sequencing
const sequencingData = [];
for (let i = 1; i <= 30; i++) {
  const start = Math.floor(Math.random() * 15); // 0 to 14, max 14+3=17 (so next is 18)
  const target = start + 3;
  sequencingData.push({
    id: `seq_${i}`,
    prompt: `Ano ang susunod?<br/>${start}, ${start+1}, ${start+2}, __ ?`,
    options: generateOptionsForNumber(target, 20),
    correctFeedback: "",
    wrongFeedback: ""
  });
}

// 3. Addition
const additionData = [];
for (let i = 1; i <= 30; i++) {
  const a = Math.floor(Math.random() * 11);
  const b = Math.floor(Math.random() * 11);
  const target = a + b;
  additionData.push({
    id: `add_${i}`,
    prompt: `Ano ang sagot?<br/>${a} + ${b} = ?`,
    options: generateOptionsForNumber(target, 20),
    correctFeedback: "",
    wrongFeedback: ""
  });
}

// 4. Subtraction
const subtractionData = [];
for (let i = 1; i <= 30; i++) {
  const a = Math.floor(Math.random() * 21); // 0 to 20
  const b = Math.floor(Math.random() * (a + 1)); // 0 to a
  const target = a - b;
  subtractionData.push({
    id: `sub_${i}`,
    prompt: `Ano ang sagot?<br/>${a} - ${b} = ?`,
    options: generateOptionsForNumber(target, 20),
    correctFeedback: "",
    wrongFeedback: ""
  });
}

// 5. Comparison
const comparisonData = [];
for (let i = 1; i <= 30; i++) {
  const nums = new Set();
  while(nums.size < 3) nums.add(Math.floor(Math.random() * 21));
  const arr = Array.from(nums);
  const max = Math.max(...arr);
  const isLargest = Math.random() > 0.5;
  const target = isLargest ? Math.max(...arr) : Math.min(...arr);
  
  const opts = arr.map(n => ({
    image: getNumImage(n),
    isCorrect: n === target,
    target: ""
  }));

  comparisonData.push({
    id: `comp_${i}`,
    prompt: isLargest ? "Alin ang pinakamalaking numero?" : "Alin ang pinakamaliit na numero?",
    options: shuffle(opts),
    correctFeedback: "",
    wrongFeedback: ""
  });
}

// 6. Measurement (Shapes odd-one-out)
const shapes = ['2c.png', '2sq.png', '2t.png', '2r.png', '2s.png'];
const measurementData = [];
for (let i = 1; i <= 30; i++) {
  const s = shuffle([...shapes]);
  const baseShape = s[0];
  const oddShape = s[1];
  
  const opts = shuffle([
    { image: baseShape, isCorrect: false, target: "" },
    { image: baseShape, isCorrect: false, target: "" },
    { image: oddShape, isCorrect: true, target: "" }
  ]);

  measurementData.push({
    id: `meas_${i}`,
    prompt: "Alin ang naiiba?",
    options: opts,
    correctFeedback: "",
    wrongFeedback: ""
  });
}

// 7. Shapes (Identify shape name)
const shapeNames = {
  '2c.png': 'Circle / Bilog',
  '2sq.png': 'Square / Parisukat',
  '2t.png': 'Triangle / Tatsulok',
  '2r.png': 'Rectangle / Parihaba',
  '2s.png': 'Star / Bituin'
};
const shapesData = [];
for (let i = 1; i <= 30; i++) {
  const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
  const others = shapes.filter(s => s !== targetShape);
  const wrong1 = others[Math.floor(Math.random() * others.length)];
  const others2 = others.filter(s => s !== wrong1);
  const wrong2 = others2[Math.floor(Math.random() * others2.length)];

  const opts = shuffle([
    { image: targetShape, isCorrect: true, target: "" },
    { image: wrong1, isCorrect: false, target: "" },
    { image: wrong2, isCorrect: false, target: "" }
  ]);

  shapesData.push({
    id: `shapes_${i}`,
    prompt: `Hanapin ang ${shapeNames[targetShape]}`,
    options: opts,
    correctFeedback: "",
    wrongFeedback: ""
  });
}


const allData = {
  numbers: numbersData,
  sequencing: sequencingData,
  addition: additionData,
  subtraction: subtractionData,
  comparison: comparisonData,
  measurement: measurementData,
  shapes: shapesData
};

for (const [topic, data] of Object.entries(allData)) {
  const fileContent = `// Auto-generated logical synthetic data
export interface Question {
  id: string;
  prompt: string;
  options: { image: string; isCorrect: boolean; target: string }[];
}

export const ${topic}Data: Question[] = ${JSON.stringify(data, null, 2)};
`;
  fs.writeFileSync(path.join(process.cwd(), `src/data/${topic}.ts`), fileContent);
}

console.log("Successfully generated logical synthetic questions for missing categories.");
