// Chord template library and matching algorithm

const CHORD_TEMPLATES = {
  'maj':  [0, 4, 7],
  'min':  [0, 3, 7],
  '7':    [0, 4, 7, 10],
  'maj7': [0, 4, 7, 11],
  'min7': [0, 3, 7, 10],
  'dim':  [0, 3, 6],
  'aug':  [0, 4, 8],
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const DISPLAY_NAMES = {
  'maj':  '',
  'min':  'm',
  '7':    '7',
  'maj7': 'maj7',
  'min7': 'm7',
  'dim':  'dim',
  'aug':  'aug',
  'sus2': 'sus2',
  'sus4': 'sus4',
};

const FULL_NAMES = {
  'maj':  'major',
  'min':  'minor',
  '7':    'dominant 7th',
  'maj7': 'major 7th',
  'min7': 'minor 7th',
  'dim':  'diminished',
  'aug':  'augmented',
  'sus2': 'suspended 2nd',
  'sus4': 'suspended 4th',
};

const MIN_MATCH_SCORE = 0.5;

export function matchChord(detectedNotes) {
  if (detectedNotes.length === 0) return null;

  // Build a set of detected pitch class indices
  const detectedSet = new Set(detectedNotes.map(n => n.index));
  // Build energy map for weighting
  const energyMap = {};
  for (const n of detectedNotes) {
    energyMap[n.index] = n.relativeEnergy;
  }

  let bestScore = -Infinity;
  let bestRoot = 0;
  let bestType = 'maj';

  for (let root = 0; root < 12; root++) {
    for (const [type, intervals] of Object.entries(CHORD_TEMPLATES)) {
      const templateNotes = intervals.map(i => (root + i) % 12);
      let score = 0;

      // Reward template notes that are present, weighted by energy
      for (const note of templateNotes) {
        if (detectedSet.has(note)) {
          score += (energyMap[note] || 0);
        } else {
          // Missing template note is a penalty
          score -= 0.5;
        }
      }

      // Penalise detected notes not in the template
      for (const idx of detectedSet) {
        if (!templateNotes.includes(idx)) {
          score -= 0.3;
        }
      }

      // Normalise by template size
      score /= templateNotes.length;

      // Bonus if root is the strongest detected note
      if (detectedNotes.length > 0 && detectedNotes[0].index === root) {
        score += 0.15;
      }

      if (score > bestScore) {
        bestScore = score;
        bestRoot = root;
        bestType = type;
      }
    }
  }

  if (bestScore < MIN_MATCH_SCORE) return null;

  return {
    root: NOTE_NAMES[bestRoot],
    rootIndex: bestRoot,
    type: bestType,
    display: NOTE_NAMES[bestRoot] + DISPLAY_NAMES[bestType],
    fullName: NOTE_NAMES[bestRoot] + ' ' + FULL_NAMES[bestType],
    score: bestScore,
  };
}
