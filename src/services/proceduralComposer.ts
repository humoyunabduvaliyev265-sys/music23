import { GeneratedComposition } from '../types';

const SCALE_NOTES: Record<string, string[]> = {
  minor: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
  major: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'],
  pentatonic: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'],
  oriental: ['D4', 'Eb4', 'F#4', 'G4', 'A4', 'Bb4', 'C#5', 'D5'],
  dorian: ['D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5'],
};

const BASS_NOTES: Record<string, string[]> = {
  minor: ['A2', 'F2', 'C2', 'G2', 'D2', 'E2'],
  major: ['C2', 'G2', 'A2', 'F2', 'D2'],
  pentatonic: ['A2', 'C2', 'D2', 'E2', 'G2'],
  oriental: ['D2', 'Eb2', 'A2', 'G2', 'Bb2'],
  dorian: ['D2', 'G2', 'C2', 'F2', 'A2'],
};

const TITLE_WORDS: Record<string, string[]> = {
  lofi: ["Tungi O'ylar", "Kechki Yomg'ir", "Choyxonada Sokinlik", "Shahar Chiroqlari", "Kuzgi Xazon"],
  ambient: ["Koinot Sadosi", "Tog'lar Shabadasi", "Moviy Suvlar", "Qalb Tinchligi", "Sokin Shamol"],
  synthwave: ["Kiber Toshkent", "Retro Avtomobil", "Neon Kechasi", "Tezyurar Poyezd", "80-yillar To'lqini"],
  trap: ["Baland Bosim", "Yangi To'lqin", "Zarba Ritmi", "Ko'cha Oqimi", "Oltin Metro"],
  oriental: ["Ipak Yo'li", "Samarqand Taronasi", "Buxoro Sadolari", "Sharq Navosi", "Bobolar Merosi"],
  house: ["Tungi Klub", "Ritmlar Oqimi", "Yorqin Kecha", "Elektron Hayot", "Tonggi Energiya"],
  classical: ["Pianino Qalbida", "Bahor Romansi", "Oydin Kecha", "Nafis Qo'shiq", "Erkin Parvoz"],
};

export function generateOfflineProceduralComposition(
  prompt: string,
  genre: string,
  bpm: number,
  scale: string
): GeneratedComposition {
  const notesPool = SCALE_NOTES[scale] || SCALE_NOTES.minor;
  const bassPool = BASS_NOTES[scale] || BASS_NOTES.minor;
  const titles = TITLE_WORDS[genre] || TITLE_WORDS.lofi;
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  // Generate 8-12 melody notes distributed across 16 steps
  const melodyNotes: { note: string; step: number; duration: number }[] = [];
  const chosenSteps = [0, 2, 4, 6, 8, 10, 12, 14].filter(() => Math.random() > 0.15);
  
  if (!chosenSteps.includes(0)) chosenSteps.unshift(0);

  chosenSteps.forEach((step) => {
    const note = notesPool[Math.floor(Math.random() * notesPool.length)];
    const duration = Math.random() > 0.6 ? 1.5 : 1.0;
    melodyNotes.push({ note, step, duration });
  });

  // Drums based on genre
  let kick = [0, 8];
  let snare = [4, 12];
  let hihat = [0, 2, 4, 6, 8, 10, 12, 14];
  let clap = [4, 12];

  if (genre === 'house') {
    kick = [0, 4, 8, 12]; // Four on the floor
    snare = [4, 12];
    hihat = [2, 6, 10, 14]; // Off-beat hi-hat
    clap = [4, 12];
  } else if (genre === 'trap') {
    kick = [0, 6, 8, 11, 14];
    snare = [8];
    hihat = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // Rapid rolls
    clap = [8];
  } else if (genre === 'ambient') {
    kick = [0, 10];
    snare = [];
    hihat = [0, 8];
    clap = [];
  } else if (genre === 'oriental') {
    kick = [0, 3, 8, 11];
    snare = [6, 14];
    hihat = [0, 2, 3, 6, 8, 10, 11, 14];
    clap = [6, 14];
  }

  // Bass line
  const bassPattern: { note: string; step: number }[] = [];
  const bassSteps = [0, 4, 8, 12];
  bassSteps.forEach((st, idx) => {
    bassPattern.push({
      note: bassPool[idx % bassPool.length],
      step: st,
    });
  });

  return {
    title: `${randomTitle} (Offlayn)`,
    artist: "Ovoz Studio Studio",
    genre,
    mood: "melodic",
    bpm: Number(bpm) || 90,
    scale,
    rootKey: scale === 'oriental' ? 'D' : (scale === 'major' ? 'C' : 'A'),
    melodyNotes,
    drumPattern: {
      kick,
      snare,
      hihat,
      clap,
    },
    bassPattern,
    description: prompt
      ? `"${prompt}" asosida to'liq offlayn rejimda sintezlangan original musiqa.`
      : "Brauzer ichidagi Web Audio sintezator yordamida to'liq offlayn yaratilgan kompozitsiya.",
  };
}
