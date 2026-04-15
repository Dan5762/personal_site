// Main app loop -- wires all modules together

import * as audio from './audio.js';
import { computeChromagram, detectNotes } from './chromagram.js';
import { matchChord } from './chords.js';
import * as ui from './ui.js';

let running = false;
let animFrameId = null;
let frameCount = 0;

// DOM refs
let startBtn = null;
let deviceSelect = null;
let sensitivitySlider = null;
let sensitivityValue = null;
let smoothingSlider = null;
let smoothingValue = null;

function loop() {
  if (!running) return;

  const analyser = audio.getAnalyser();
  const sampleRate = audio.getSampleRate();

  const chroma = computeChromagram(analyser, sampleRate);
  const threshold = parseFloat(sensitivitySlider.value);
  const notes = detectNotes(chroma, threshold);
  const chord = matchChord(notes);

  ui.updateChromagram(chroma);
  ui.updateInputLevel(chroma);
  ui.updateNotes(notes);
  ui.updateChord(chord);

  // Log diagnostics every 120 frames (~2s)
  frameCount++;
  if (frameCount % 120 === 0) {
    const maxE = Math.max(...chroma);
    console.log(`[chord-detector] frame=${frameCount} maxChroma=${maxE.toFixed(4)} notes=${notes.map(n => n.name).join(',') || 'none'} chord=${chord ? chord.display : 'none'}`);
  }

  animFrameId = requestAnimationFrame(loop);
}

async function populateDevices() {
  try {
    const devices = await audio.enumerateInputDevices();
    deviceSelect.innerHTML = '';
    for (const d of devices) {
      const opt = document.createElement('option');
      opt.value = d.deviceId;
      opt.textContent = d.label || `Mic ${deviceSelect.options.length + 1}`;
      deviceSelect.appendChild(opt);
    }
    console.log('[chord-detector] found', devices.length, 'input devices:', devices.map(d => d.label).join(', '));
  } catch (err) {
    console.warn('[chord-detector] could not enumerate devices:', err);
  }
}

async function toggle() {
  if (running) {
    running = false;
    frameCount = 0;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    audio.stop();
    ui.setButtonState(startBtn, false);
    ui.setStatus('tap start to begin');
    console.log('[chord-detector] stopped');
    return;
  }

  try {
    ui.setStatus('requesting mic access...');
    console.log('[chord-detector] requesting mic...');
    const smoothing = parseFloat(smoothingSlider.value);
    const deviceId = deviceSelect.value;
    await audio.start(8192, smoothing, deviceId);
    console.log('[chord-detector] mic acquired, sampleRate=' + audio.getSampleRate());
    running = true;
    ui.setButtonState(startBtn, true);
    ui.setStatus('listening');
    loop();
  } catch (err) {
    ui.setStatus('mic access denied');
    console.error('[chord-detector] Audio start failed:', err);
  }
}

function onSensitivityChange() {
  const val = parseFloat(sensitivitySlider.value);
  sensitivityValue.textContent = val.toFixed(2);
}

function onSmoothingChange() {
  const val = parseFloat(smoothingSlider.value);
  smoothingValue.textContent = val.toFixed(2);
  audio.setSmoothing(val);
}

export async function init() {
  console.log('[chord-detector] initialising...');
  ui.init();

  startBtn = document.getElementById('start-btn');
  deviceSelect = document.getElementById('device-select');
  sensitivitySlider = document.getElementById('sensitivity');
  sensitivityValue = document.getElementById('sensitivity-value');
  smoothingSlider = document.getElementById('smoothing');
  smoothingValue = document.getElementById('smoothing-value');

  startBtn.addEventListener('click', toggle);
  sensitivitySlider.addEventListener('input', onSensitivityChange);
  smoothingSlider.addEventListener('input', onSmoothingChange);

  // Handle iOS AudioContext suspension
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && running) {
      audio.resumeIfSuspended();
    }
  });

  // Populate device list (needs mic permission first time)
  await populateDevices();

  ui.setStatus('tap start to begin');
  console.log('[chord-detector] ready');
}

// Boot
document.addEventListener('DOMContentLoaded', init);
