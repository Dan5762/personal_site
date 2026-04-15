// UI module -- DOM rendering for chromagram, notes, chord name, controls

import { getNoteNames } from './chromagram.js';

const NOTE_NAMES = getNoteNames();

let noteDots = [];
let energyBars = [];
let chordDisplay = null;
let chordSubtitle = null;
let statusText = null;
let levelBar = null;

export function init() {
  const grid = document.getElementById('note-grid');
  chordDisplay = document.getElementById('chord-name');
  chordSubtitle = document.getElementById('chord-subtitle');
  statusText = document.getElementById('status-text');
  levelBar = document.getElementById('input-level');

  // Build 12 note columns
  for (let i = 0; i < 12; i++) {
    const col = document.createElement('div');
    col.className = 'note-col';

    const barWrap = document.createElement('div');
    barWrap.className = 'energy-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'energy-bar';
    barWrap.appendChild(bar);

    const dot = document.createElement('div');
    dot.className = 'note-dot';
    dot.textContent = NOTE_NAMES[i];

    col.appendChild(barWrap);
    col.appendChild(dot);
    grid.appendChild(col);

    noteDots.push(dot);
    energyBars.push(bar);
  }
}

export function updateChromagram(chroma) {
  if (!chroma) return;
  const maxEnergy = Math.max(...chroma);
  const scale = maxEnergy > 0 ? 1 / maxEnergy : 0;

  for (let i = 0; i < 12; i++) {
    const pct = chroma[i] * scale * 100;
    energyBars[i].style.height = pct + '%';
  }
}

export function updateInputLevel(chroma) {
  if (!levelBar || !chroma) return;
  const maxEnergy = Math.max(...chroma);
  // Map to a 0-100 scale using log to compress range
  const level = maxEnergy > 0 ? Math.min(100, Math.max(0, (Math.log10(maxEnergy) + 3) * 33)) : 0;
  levelBar.style.width = level + '%';
}

export function updateNotes(detectedNotes) {
  const activeSet = new Set(detectedNotes.map(n => n.index));

  for (let i = 0; i < 12; i++) {
    if (activeSet.has(i)) {
      noteDots[i].classList.add('active');
    } else {
      noteDots[i].classList.remove('active');
    }
  }
}

export function updateChord(chord) {
  if (!chord) {
    chordDisplay.textContent = '---';
    chordDisplay.classList.remove('has-chord');
    chordSubtitle.textContent = 'play a chord';
    return;
  }
  chordDisplay.textContent = chord.display;
  chordDisplay.classList.add('has-chord');
  chordSubtitle.textContent = chord.fullName;
}

export function setStatus(text) {
  if (statusText) {
    statusText.textContent = text;
  }
}

export function setButtonState(button, running) {
  if (running) {
    button.textContent = 'STOP';
    button.classList.add('is-running');
  } else {
    button.textContent = 'START';
    button.classList.remove('is-running');
  }
}
