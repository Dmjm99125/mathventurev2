import fs from 'fs';
import path from 'path';

const SRC_DIR = './docs/legacy-prototype-reference';
const OUT_DIR = './src/data';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const chapters = [
  { id: '1', name: 'colors' },
  { id: '2', name: 'shapes' },
  { id: '3', name: 'sequencing' },
  { id: '4', name: 'addition' },
  { id: '5', name: 'subtraction' },
  { id: '6', name: 'numbers' },
  { id: '7', name: 'measurement' },
  { id: '8', name: 'comparison' },
  { id: '9', name: 'clock' }
];

chapters.forEach(ch => {
  const chapterFiles = fs.readdirSync(SRC_DIR).filter(f => f.startsWith(ch.id) && f.endsWith('.html'));
  
  const questions = [];
  
  // We look for files that have 'cor.html' or 'wr.html' as targets. 
  // This means they are question files.
  chapterFiles.forEach(file => {
    if (file.includes('cor') || file.includes('wr') || file === ch.id + '.html' || file.includes('n.html')) return;
    
    const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf-8');
    
    // Check if it's a question by looking for 'cor.html'
    if (content.includes('cor.html')) {
      const q = {
        id: file.replace('.html', ''),
        prompt: '',
        options: [],
        correctFeedback: '',
        wrongFeedback: ''
      };
      
      // Extract prompt text roughly
      const promptMatch = content.match(/<font size="10">(.*?)<\/font>/i);
      if (promptMatch) {
        q.prompt = promptMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      
      // Extract correct option
      const corMatch = content.match(/<a href="([^"]+cor\.html)"><img src="([^"]+)"/i);
      if (corMatch) {
        q.options.push({ image: corMatch[2], isCorrect: true, target: corMatch[1] });
      }
      
      // Extract wrong options
      const wrRegex = /<a href="([^"]+wr[0-9]*\.html)"><img src="([^"]+)"/gi;
      let wrMatch;
      while ((wrMatch = wrRegex.exec(content)) !== null) {
        q.options.push({ image: wrMatch[2], isCorrect: false, target: wrMatch[1] });
      }
      
      if (q.options.length > 0) {
        questions.push(q);
      }
    }
  });

  questions.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

  const tsContent = `// Auto-generated from legacy prototype
export interface Question {
  id: string;
  prompt: string;
  options: { image: string; isCorrect: boolean; target: string }[];
}

export const ${ch.name}Data: Question[] = ${JSON.stringify(questions, null, 2)};
`;
  
  fs.writeFileSync(path.join(OUT_DIR, `${ch.name}.ts`), tsContent);
});

console.log('Legacy parsing complete.');

