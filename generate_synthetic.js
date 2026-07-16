import fs from 'fs';
import path from 'path';

const imagesDir = path.join(process.cwd(), 'public/assets/images');
const allImages = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.gif'));

function getRandomImages(count) {
  const shuffled = [...allImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const categories = {
  shapes: { prompt: "Alin sa mga sumusunod ang hugis na hinahanap?" },
  sequencing: { prompt: "Ano ang susunod na numero o hugis?" },
  addition: { prompt: "Ano ang sagot sa addition na ito?" },
  subtraction: { prompt: "Ano ang sagot sa subtraction na ito?" },
  numbers: { prompt: "Alin dito ang tamang numero?" },
  measurement: { prompt: "Alin ang mas malaki/mahaba?" },
  comparison: { prompt: "Alin sa dalawa ang mas madami?" }
};

for (const [topic, config] of Object.entries(categories)) {
  const questions = [];
  
  for (let i = 1; i <= 30; i++) {
    const images = getRandomImages(3);
    const correctIndex = Math.floor(Math.random() * 3);
    
    questions.push({
      id: `${topic}_${i}`,
      prompt: `${config.prompt} (Question ${i})`,
      options: images.map((img, idx) => ({
        image: img,
        isCorrect: idx === correctIndex,
        target: ""
      })),
      correctFeedback: "",
      wrongFeedback: ""
    });
  }

  const fileContent = `// Auto-generated synthetic data
export interface Question {
  id: string;
  prompt: string;
  options: { image: string; isCorrect: boolean; target: string }[];
}

export const ${topic}Data: Question[] = ${JSON.stringify(questions, null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), `src/data/${topic}.ts`), fileContent);
}

console.log("Successfully generated synthetic questions for all missing categories.");
