// Lesson content for all 9 chapters
// Video citations are verbatim from the <font size="5"> caption blocks
// in each chapter's intro page (1n.html – 9n.html) of the legacy prototype.

export interface LessonSlide {
  /** Unique key for this slide */
  id: string;
  /** Image to display (relative to /assets/images/) */
  image?: string;
  /** Video to display (relative to /assets/videos/) */
  video?: string;
  /** English label */
  labelEn: string;
  /** Filipino label */
  labelFil: string;
  /** Path to English pronunciation audio (relative to /assets/audio/audio/) */
  audioEn?: string;
  /** Path to Filipino pronunciation audio (relative to /assets/audio/audio/) */
  audioFil?: string;
}

export interface TopicLesson {
  topic: string;
  /** Path to video (relative to /assets/videos/) */
  videoSrc: string;
  /** Full verbatim title from the legacy prototype caption block */
  videoTitle: string;
  /** Creator credit from the legacy prototype caption block */
  videoCredit: string;
  /** Slides for the lesson proper stage */
  slides: LessonSlide[];
}

// Helper for audio paths
const aud = (file: string) => `/assets/audio/audio/${file}`;

export const lessonContent: Record<string, TopicLesson> = {

  // ─── Chapter 1: Colors ──────────────────────────────────────────────────────
  // Source: 1n.html / 1a.html
  colors: {
    topic: 'colors',
    videoSrc: '/assets/videos/color.mp4',
    videoTitle: 'Mga Kulay Song by Teacher Cathy',
    videoCredit: 'Cher Cathy Lyn',
    slides: [
      { id: 'c-red',    image: '1red.png',  labelEn: 'Red',    labelFil: 'Pula',        audioEn: aud('1red.MP3'),    audioFil: aud('1pula.MP3')  },
      { id: 'c-orange', image: '1or.png',   labelEn: 'Orange', labelFil: 'Kahel',       audioEn: aud('1orange.mp3'), audioFil: aud('1kahel.MP3') },
      { id: 'c-yellow', image: '1yel.png',  labelEn: 'Yellow', labelFil: 'Dilaw',       audioEn: aud('1yellow.mp3'), audioFil: aud('1dilaw.MP3') },
      { id: 'c-green',  image: '1grn.png',  labelEn: 'Green',  labelFil: 'Berde',       audioEn: aud('1green.mp3'),  audioFil: aud('1berde.MP3') },
      { id: 'c-blue',   image: '1blu.png',  labelEn: 'Blue',   labelFil: 'Asul',        audioEn: aud('1blue.mp3'),   audioFil: aud('1asul.MP3')  },
      { id: 'c-violet', image: '1vio.png',  labelEn: 'Violet', labelFil: 'Lila',        audioEn: aud('1violet.mp3'), audioFil: aud('1lila.MP3')  },
      { id: 'c-pink',   image: '1pink.png', labelEn: 'Pink',   labelFil: 'Rosas',       audioEn: aud('1pink.mp3'),   audioFil: aud('1rosas.MP3') },
      { id: 'c-white',  image: '1whi.png',  labelEn: 'White',  labelFil: 'Puti',        audioEn: aud('1white.mp3'),  audioFil: aud('1puti.MP3')  },
      { id: 'c-brown',  image: '1bro.png',  labelEn: 'Brown',  labelFil: 'Kayumanggi',  audioEn: aud('1brown.mp3'),  audioFil: aud('1kayu.MP3')  },
      { id: 'c-black',  image: '1bla.png',  labelEn: 'Black',  labelFil: 'Itim',        audioEn: aud('1black.mp3'),  audioFil: aud('1itim.MP3')  },
      { id: 'c-gray',   image: '1gra.png',  labelEn: 'Gray',   labelFil: 'Abo',         audioEn: aud('1gray.MP3'),   audioFil: aud('1abo.MP3')   },
    ],
  },

  // ─── Chapter 2: Shapes ──────────────────────────────────────────────────────
  // Source: 2n.html / 2a.html
  shapes: {
    topic: 'shapes',
    videoSrc: '/assets/videos/shapes.mp4',
    videoTitle: '(KinderTV Sing-along!) "Mga Hugis"',
    videoCredit: 'SMES KinderTV',
    slides: [
      { id: 's-circle',    image: '2c.png',  labelEn: 'Circle',    labelFil: 'Bilog',     audioEn: aud('2c.mp3'),  audioFil: aud('2bil.MP3')  },
      { id: 's-triangle',  image: '2t.png',  labelEn: 'Triangle',  labelFil: 'Tatsulok',  audioEn: aud('2t.mp3'),  audioFil: aud('2tat.MP3')  },
      { id: 's-square',    image: '2s.png',  labelEn: 'Square',    labelFil: 'Parisukat', audioEn: aud('2s.mp3'),  audioFil: aud('2pari.MP3') },
      { id: 's-rectangle', image: '2r.png',  labelEn: 'Rectangle', labelFil: 'Parihaba',  audioEn: aud('2r.mp3'),  audioFil: aud('2parih.MP3')},
      { id: 's-oval',      image: '2ov.png', labelEn: 'Oval',      labelFil: 'Ovalado',   audioEn: aud('2o.mp3'),  audioFil: aud('2pu.MP3')   },
      { id: 's-diamond',   image: '2d.png',  labelEn: 'Diamond',   labelFil: 'Diyamante', audioEn: aud('2d.mp3'),  audioFil: aud('2dia.MP3')  },
      { id: 's-heart',     image: '2h.png',  labelEn: 'Heart',     labelFil: 'Puso',      audioEn: aud('2h.mp3'),  audioFil: aud('2hab.MP3')  },
      { id: 's-star',      image: '2sq.png', labelEn: 'Star',      labelFil: 'Bituin',    audioEn: aud('2sq.mp3'), audioFil: aud('2tala.MP3') },
    ],
  },

  // ─── Chapter 3: Sequencing ──────────────────────────────────────────────────
  // Source: 3n.html / 3a.html — alphabet, number sequence, size ordering
  sequencing: {
    topic: 'sequencing',
    videoSrc: '/assets/videos/alpa.mp4',
    videoTitle: 'Alpabetong Pilipino / Ang Bagong Alpabetong Filipino / Tagalog / Awiting Pambata',
    videoCredit: 'Musikwela Kids TV',
    slides: [
      { id: 'sq-alpha', image: 'alp.png', labelEn: 'The Alphabet', labelFil: 'Alpabeto' },
      { id: 'sq-alr',   image: 'alr.png', labelEn: 'Alphabet Order', labelFil: 'Ayos ng Alpabeto' },
      { id: 'sq-sn1',   image: 'sn1.png', labelEn: 'Small',   labelFil: 'Maliit' },
      { id: 'sq-sn2',   image: 'sn2.png', labelEn: 'Smaller', labelFil: 'Mas Maliit' },
      { id: 'sq-sn3',   image: 'sn3.png', labelEn: 'Medium',  labelFil: 'Katamtaman' },
      { id: 'sq-sn4',   image: 'sn4.png', labelEn: 'Bigger',  labelFil: 'Mas Malaki' },
      { id: 'sq-sn5',   image: 'sn5.png', labelEn: 'Biggest', labelFil: 'Pinaka Malaki' },
    ],
  },

  // ─── Chapter 4: Addition ────────────────────────────────────────────────────
  // Source: 4n.html / 4.html
  addition: {
    topic: 'addition',
    videoSrc: '/assets/videos/add.mp4',
    videoTitle: 'Motivational Song in Math 1 Pagdaragdag',
    videoCredit: 'Teacher Nim',
    slides: [
      { id: 'add-concept', image: 'dag.png', labelEn: 'Addition means adding', labelFil: 'Pagdaragdag — dagdag pa!' },
      { id: 'add-a',       image: '4a.png',  labelEn: 'Adding groups',          labelFil: 'Pagdaragdag ng grupo' },
      { id: 'add-b',       image: '4b.png',  labelEn: 'Count them together',    labelFil: 'Bilangin natin!' },
      { id: 'add-c',       image: '4c.png',  labelEn: 'Sum of objects',         labelFil: 'Kabuuan ng mga bagay' },
      { id: 'add-d',       image: '4d.png',  labelEn: 'Number sentence',        labelFil: 'Pangungusap na bilang' },
      { id: 'add-e',       image: '4e.png',  labelEn: 'Practice problems',      labelFil: 'Pagsasanay' },
      { id: 'add-f',       image: '4f.png',  labelEn: 'More practice',          labelFil: 'Dagdag na pagsasanay' },
      { id: 'add-g',       image: '4g.png',  labelEn: 'Keep counting',          labelFil: 'Ipagpatuloy ang pagbilang' },
      { id: 'add-411',     image: '411.png', labelEn: 'Addition example 1',     labelFil: 'Halimbawa 1' },
      { id: 'add-412',     image: '412.png', labelEn: 'Addition example 2',     labelFil: 'Halimbawa 2' },
      { id: 'add-413',     image: '413.png', labelEn: 'Addition example 3',     labelFil: 'Halimbawa 3' },
      { id: 'add-414',     image: '414.png', labelEn: 'Addition example 4',     labelFil: 'Halimbawa 4' },
      { id: 'add-415',     image: '415.png', labelEn: 'Addition example 5',     labelFil: 'Halimbawa 5' },
      { id: 'add-416',     image: '416.png', labelEn: 'Addition example 6',     labelFil: 'Halimbawa 6' },
      { id: 'add-417',     image: '417.png', labelEn: 'Addition example 7',     labelFil: 'Halimbawa 7' },
      { id: 'add-418',     image: '418.png', labelEn: 'Addition example 8',     labelFil: 'Halimbawa 8' },
      { id: 'add-419',     image: '419.png', labelEn: 'Addition example 9',     labelFil: 'Halimbawa 9' },
      { id: 'add-420',     image: '420.png', labelEn: 'Addition example 10',    labelFil: 'Halimbawa 10' },
      { id: 'add-v1',      video: '4v1.mp4', labelEn: 'Video Activity 1',       labelFil: 'Bidyo Gawain 1' },
      { id: 'add-v2',      video: '4v2.mp4', labelEn: 'Video Activity 2',       labelFil: 'Bidyo Gawain 2' },
    ],
  },

  // ─── Chapter 5: Subtraction ─────────────────────────────────────────────────
  // Source: 5n.html / 5.html
  subtraction: {
    topic: 'subtraction',
    videoSrc: '/assets/videos/sub.mp4',
    videoTitle: 'CHIKADING | Tagalog Energizer Action Subtraction Song | Pinoy BK Channel 🇵🇭',
    videoCredit: 'Pinoy BK Channel',
    slides: [
      { id: 'sub-concept', image: 'bawas.png', labelEn: 'Subtraction means taking away', labelFil: 'Pagbabawas — bawas!' },
      { id: 'sub-a',       image: '5o.png',    labelEn: 'Taking away objects',           labelFil: 'Pag-aalis ng mga bagay' },
      { id: 'sub-b',       image: '5pa.png',   labelEn: 'How many are left?',            labelFil: 'Ilang natira?' },
      { id: 'sub-c',       image: '5pb.jpg',   labelEn: 'Subtraction sentence',          labelFil: 'Pangungusap ng pagbabawas' },
      { id: 'sub-d',       image: '5pc.jpg',   labelEn: 'Finding the difference',        labelFil: 'Paghanap ng pagkakaiba' },
    ],
  },

  // ─── Chapter 6: Numbers ─────────────────────────────────────────────────────
  // Source: 6n.html / 6.html — numbers 0–10 with images + bilingual audio
  numbers: {
    topic: 'numbers',
    videoSrc: '/assets/videos/num.mp4',
    videoTitle: 'Isa, Dalawa, Tatlo | Filipino Nursery Rhymes & Songs | Awiting Pambata',
    videoCredit: 'Flexy Bear',
    slides: [
      { id: 'n-0',  image: '60.png',  labelEn: 'Zero',  labelFil: 'Wala',   audioEn: aud('60.mp3'),  audioFil: aud('6v0.MP3')  },
      { id: 'n-1',  image: '61.png',  labelEn: 'One',   labelFil: 'Isa',    audioEn: aud('61.mp3'),  audioFil: aud('6v1.MP3')  },
      { id: 'n-2',  image: '62.png',  labelEn: 'Two',   labelFil: 'Dalawa', audioEn: aud('62.mp3'),  audioFil: aud('6v2.MP3')  },
      { id: 'n-3',  image: '63.png',  labelEn: 'Three', labelFil: 'Tatlo',  audioEn: aud('63.mp3'),  audioFil: aud('6v3.MP3')  },
      { id: 'n-4',  image: '64.png',  labelEn: 'Four',  labelFil: 'Apat',   audioEn: aud('64.mp3'),  audioFil: aud('6v4.MP3')  },
      { id: 'n-5',  image: '65.png',  labelEn: 'Five',  labelFil: 'Lima',   audioEn: aud('65.mp3'),  audioFil: aud('6v5.MP3')  },
      { id: 'n-6',  image: '66.png',  labelEn: 'Six',   labelFil: 'Anim',   audioEn: aud('66.mp3'),  audioFil: aud('6v6.MP3')  },
      { id: 'n-7',  image: '67.png',  labelEn: 'Seven', labelFil: 'Pito',   audioEn: aud('67.mp3'),  audioFil: aud('6v7.MP3')  },
      { id: 'n-8',  image: '68.png',  labelEn: 'Eight', labelFil: 'Walo',   audioEn: aud('68.mp3'),  audioFil: aud('6v8.MP3')  },
      { id: 'n-9',  image: '69.png',  labelEn: 'Nine',  labelFil: 'Siyam',  audioEn: aud('69.mp3'),  audioFil: aud('6v9.MP3')  },
      { id: 'n-10', image: '610.png', labelEn: 'Ten',   labelFil: 'Sampu',  audioEn: aud('610.mp3'), audioFil: aud('6v10.MP3') },
    ],
  },

  // ─── Chapter 7: Measurement ─────────────────────────────────────────────────
  // Source: 7n.html / 7.html — comparing sizes/lengths
  measurement: {
    topic: 'measurement',
    videoSrc: '/assets/videos/comp.mp4',
    videoTitle: 'Maliliit at Malalaking Hayop | Flexy Bear Original Awiting Pambata Nursery Rhymes & Songs',
    videoCredit: 'Flexy Bear',
    slides: [
      { id: 'm-intro', image: '7su.png', labelEn: 'Measurement',   labelFil: 'Pagsukat' },
      { id: 'm-1',     image: 'mt1.png', labelEn: 'Long / Short',   labelFil: 'Mahaba / Maikli' },
      { id: 'm-2',     image: 'mt2.png', labelEn: 'Tall / Short',   labelFil: 'Matangkad / Mababa' },
      { id: 'm-3',     image: 'mt3.png', labelEn: 'Big / Small',    labelFil: 'Malaki / Maliit' },
      { id: 'm-4',     image: 'mt4.png', labelEn: 'Heavy / Light',  labelFil: 'Mabigat / Magaan' },
      { id: 'm-5',     image: 'mt5.png', labelEn: 'Full / Empty',   labelFil: 'Puno / Walang laman' },
    ],
  },

  // ─── Chapter 8: Comparison ──────────────────────────────────────────────────
  // Source: 8n.html / 8.html
  // Note: creator credit reads only "~ A" in the source HTML — incomplete attribution.
  comparison: {
    topic: 'comparison',
    videoSrc: '/assets/videos/sukat.mp4',
    videoTitle: 'Haba at ikli | Awit ng Pagsukat | Pambata',
    videoCredit: 'Unknown', // original source reads "~ A" — incomplete
    slides: [
      { id: 'cmp-intro', image: 'kum.png', labelEn: 'Comparison',     labelFil: 'Paghahambing' },
      { id: 'cmp-1',     image: 'cp1.png', labelEn: 'More / Fewer',   labelFil: 'Mas Marami / Mas Kaunti' },
      { id: 'cmp-2',     image: 'cp2.png', labelEn: 'Same amount',    labelFil: 'Magkasinlaki' },
      { id: 'cmp-3',     image: 'cp3.png', labelEn: 'Bigger / Smaller', labelFil: 'Mas Malaki / Mas Maliit' },
      { id: 'cmp-4',     image: 'cp4.png', labelEn: 'Longest / Shortest', labelFil: 'Pinakamahaba / Pinakamaikli' },
      { id: 'cmp-5',     image: 'cp5.png', labelEn: 'Comparing groups', labelFil: 'Paghahambing ng grupo' },
    ],
  },

  // ─── Chapter 9: Telling Time ─────────────────────────────────────────────────
  // Source: 9n.html / 9na.html — clock faces 1–12 o'clock with audio
  clock: {
    topic: 'clock',
    videoSrc: '/assets/videos/ov.mp4',
    videoTitle: '"Orasan" — Grade 1 Action Song — "Pagsabi at Pagsulat ng Oras gamit ang Orasang Analogo"',
    videoCredit: 'Teacher Glie',
    slides: [
      { id: 'cl-intro', image: '9ora.png', labelEn: 'Telling Time',    labelFil: 'Pagsasabi ng Oras' },
      { id: 'cl-1',     image: '21o.png',  labelEn: '1 o\'clock',      labelFil: 'Ika-isa',    audioEn: aud('21v.mp3')  },
      { id: 'cl-2',     image: '22o.png',  labelEn: '2 o\'clock',      labelFil: 'Ika-dalawa', audioEn: aud('22v.mp3')  },
      { id: 'cl-3',     image: '23o.png',  labelEn: '3 o\'clock',      labelFil: 'Ika-tatlo',  audioEn: aud('23v.mp3')  },
      { id: 'cl-4',     image: '24o.png',  labelEn: '4 o\'clock',      labelFil: 'Ika-apat',   audioEn: aud('24v.mp3')  },
      { id: 'cl-5',     image: '25o.png',  labelEn: '5 o\'clock',      labelFil: 'Ika-lima',   audioEn: aud('25v.mp3')  },
      { id: 'cl-6',     image: '26o.png',  labelEn: '6 o\'clock',      labelFil: 'Ika-anim',   audioEn: aud('26v.mp3')  },
      { id: 'cl-7',     image: '27o.png',  labelEn: '7 o\'clock',      labelFil: 'Ika-pito',   audioEn: aud('27v.mp3')  },
      { id: 'cl-8',     image: '28o.png',  labelEn: '8 o\'clock',      labelFil: 'Ika-walo',   audioEn: aud('28v.mp3')  },
      { id: 'cl-9',     image: '29o.png',  labelEn: '9 o\'clock',      labelFil: 'Ika-siyam',  audioEn: aud('29v.mp3')  },
      { id: 'cl-10',    image: '210o.png', labelEn: '10 o\'clock',     labelFil: 'Ika-sampu',  audioEn: aud('210v.mp3') },
      { id: 'cl-11',    image: '211o.png', labelEn: '11 o\'clock',     labelFil: 'Ika-labing isa', audioEn: aud('211v.mp3') },
      { id: 'cl-12',    image: '212o.png', labelEn: '12 o\'clock',     labelFil: 'Ika-labindalawa', audioEn: aud('212v.mp3') },
    ],
  },
};
