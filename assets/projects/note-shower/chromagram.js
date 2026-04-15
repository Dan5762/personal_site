// DSP module -- FFT-to-chromagram folding and note detection

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIN_FREQ = 70;   // just below low E (82 Hz)
const MAX_FREQ = 4000;  // capture harmonics
const NOISE_FLOOR = 0.001;

// Reusable buffer -- allocated once per fftSize
let fftData = null;
let lastBinCount = 0;

export function computeChromagram(analyser, sampleRate) {
  const fftSize = analyser.fftSize;
  const binCount = analyser.frequencyBinCount;

  // Allocate buffer only when size changes
  if (binCount !== lastBinCount) {
    fftData = new Float32Array(binCount);
    lastBinCount = binCount;
  }

  analyser.getFloatFrequencyData(fftData);

  const chroma = new Float32Array(12);
  const minBin = Math.ceil(MIN_FREQ * fftSize / sampleRate);
  const maxBin = Math.min(Math.floor(MAX_FREQ * fftSize / sampleRate), binCount - 1);

  for (let k = minBin; k <= maxBin; k++) {
    const freq = k * sampleRate / fftSize;
    const midiNote = 12 * Math.log2(freq / 440) + 69;
    const pitchClass = Math.round(midiNote) % 12;
    // Convert dB to linear energy before accumulating
    const energy = Math.pow(10, fftData[k] / 20);
    chroma[(pitchClass + 12) % 12] += energy;
  }

  return chroma;
}

export function detectNotes(chroma, threshold = 0.4) {
  const maxEnergy = Math.max(...chroma);
  if (maxEnergy < NOISE_FLOOR) return [];

  const notes = [];
  for (let i = 0; i < 12; i++) {
    const relativeEnergy = chroma[i] / maxEnergy;
    if (relativeEnergy >= threshold) {
      notes.push({
        name: NOTE_NAMES[i],
        index: i,
        energy: chroma[i],
        relativeEnergy,
      });
    }
  }

  return notes.sort((a, b) => b.energy - a.energy);
}

export function getNoteNames() {
  return NOTE_NAMES;
}
