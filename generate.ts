import fs from 'fs';
import path from 'path';
import { allTopics } from './src/data/index';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const freePlayTopics = {};

for (const [topic, questions] of Object.entries(allTopics)) {
  const newQuestions = [];
  
  // Collect all wrong options for this topic
  const allWrongOptions = [];
  questions.forEach(q => {
    q.options.forEach(opt => {
      if (!opt.isCorrect) {
        allWrongOptions.push(opt);
      }
    });
  });

  questions.forEach(q => {
    // Keep the same prompt and the correct option
    const correctOpt = q.options.find(opt => opt.isCorrect);
    
    if (!correctOpt) {
      newQuestions.push({ ...q });
      return;
    }

    // Pick 2 random wrong options from the entire topic pool
    const wrong1 = allWrongOptions[Math.floor(Math.random() * allWrongOptions.length)];
    const wrong2 = allWrongOptions[Math.floor(Math.random() * allWrongOptions.length)];

    const newOptions = shuffle([correctOpt, wrong1, wrong2]);

    newQuestions.push({
      ...q,
      id: q.id + '_fp',
      options: newOptions
    });
  });

  // Also shuffle the order of the questions
  freePlayTopics[topic] = shuffle(newQuestions);
}

const outputContent = `// Auto-generated free play questions
import { Question } from './colors'; // assuming Question interface is exported from colors

export const freePlayTopics: Record<string, Question[]> = ${JSON.stringify(freePlayTopics, null, 2)};
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/freePlay.ts'), outputContent);
console.log('Successfully generated src/data/freePlay.ts');
