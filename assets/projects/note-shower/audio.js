// Audio capture module -- mic stream + Web Audio graph setup

let audioContext = null;
let analyser = null;
let sourceNode = null;
let stream = null;

const DEFAULT_FFT_SIZE = 8192;
const DEFAULT_SMOOTHING = 0.8;
const MIN_DECIBELS = -100;
const MAX_DECIBELS = -10;

export function getAnalyser() {
  return analyser;
}

export function getAudioContext() {
  return audioContext;
}

export function getSampleRate() {
  return audioContext ? audioContext.sampleRate : 48000;
}

export function isActive() {
  return audioContext !== null && audioContext.state === 'running';
}

export async function enumerateInputDevices() {
  // Need a temporary getUserMedia call to get device labels
  const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  tempStream.getTracks().forEach(t => t.stop());

  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === 'audioinput');
}

export async function start(fftSize = DEFAULT_FFT_SIZE, smoothing = DEFAULT_SMOOTHING, deviceId = '') {
  // Create AudioContext FIRST, inside the user gesture context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  console.log('[audio] AudioContext created, state:', audioContext.state, 'sampleRate:', audioContext.sampleRate);

  // Ensure it's running (Chrome may still suspend)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    console.log('[audio] AudioContext resumed, state:', audioContext.state);
  }

  // Build audio constraints
  const audioConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };
  if (deviceId) {
    audioConstraints.deviceId = { exact: deviceId };
  }

  // Request mic with raw audio -- disable browser processing
  stream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraints,
  });

  const tracks = stream.getAudioTracks();
  console.log('[audio] Mic stream acquired, tracks:', tracks.length, 'track state:', tracks[0]?.readyState, 'label:', tracks[0]?.label);

  sourceNode = audioContext.createMediaStreamSource(stream);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothing;
  analyser.minDecibels = MIN_DECIBELS;
  analyser.maxDecibels = MAX_DECIBELS;

  // Connect source -> analyser (no output to speakers)
  sourceNode.connect(analyser);

  // Verify data is flowing -- read one frame after a short delay
  await new Promise(r => setTimeout(r, 200));
  const testBuf = new Float32Array(analyser.frequencyBinCount);
  analyser.getFloatFrequencyData(testBuf);
  const sample = testBuf.slice(0, 10).map(v => v.toFixed(1)).join(', ');
  const nonInf = testBuf.filter(v => v > -Infinity).length;
  console.log('[audio] FFT sanity check: first 10 bins:', sample, '| non-Infinity bins:', nonInf, '/', testBuf.length);

  return analyser;
}

export function stop() {
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
}

export function setSmoothing(value) {
  if (analyser) {
    analyser.smoothingTimeConstant = value;
  }
}

export function setFftSize(size) {
  if (analyser) {
    analyser.fftSize = size;
  }
}

// Handle iOS Safari AudioContext suspension
export function resumeIfSuspended() {
  if (audioContext && audioContext.state === 'suspended') {
    return audioContext.resume();
  }
  return Promise.resolve();
}
