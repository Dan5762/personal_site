(function () {
  'use strict';

  // ─── CIRCLE OF FIFTHS DATA ───
  // Standard circle of fifths order (clockwise)
  const CIRCLE = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

  // Frequencies in octave 4 (Hz)
  const FREQ = {
    'C': 261.63, 'G': 392.00, 'D': 293.66, 'A': 440.00,
    'E': 329.63, 'B': 493.88, 'F#': 369.99, 'Db': 277.18,
    'Ab': 415.30, 'Eb': 311.13, 'Bb': 466.16, 'F': 349.23
  };

  // Interval names for each step around the circle
  const INTERVALS = {
    1: 'Perfect 5th', 2: 'Major 2nd', 3: 'Major 6th',
    4: 'Major 3rd', 5: 'Major 7th', 6: 'Tritone',
    7: 'Minor 2nd', 8: 'Minor 6th', 9: 'Minor 3rd',
    10: 'Minor 7th', 11: 'Perfect 4th'
  };

  // Chord intervals in semitones from root
  const CHORDS = {
    'none':  [0],
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'dom7':  [0, 4, 7, 10],
    'maj7':  [0, 4, 7, 11],
    'min7':  [0, 3, 7, 10],
    'sus4':  [0, 5, 7],
    'sus2':  [0, 2, 7],
    'dim':   [0, 3, 6],
    'aug':   [0, 4, 8],
    'power': [0, 7]
  };

  // ─── CANVAS SETUP ───
  const canvas = document.getElementById('cofCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const CX = W / 2;
  const CY = H / 2;
  const RADIUS = 175;
  const LABEL_RADIUS = RADIUS + 35;
  const DOT_RADIUS = 6;

  // ─── STATE ───
  let stepSize = 7;
  let tempo = 140;
  let chordType = 'none';
  let looping = false;
  let startNoteIndex = 3; // A is at index 3 in CIRCLE
  let currentIndex = startNoteIndex;
  let visitedPath = [startNoteIndex];
  let isPlaying = false;
  let audioCtx = null;

  // Animation
  let animProgress = 0;
  let stepTimerId = null;
  let animFrameId = null;
  let stepStartTime = 0;

  // ─── AUDIO ───
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playNote(noteName) {
    var ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();

    var rootFreq = FREQ[noteName];
    var intervals = CHORDS[chordType];
    var volume = intervals.length === 1 ? 0.22 : 0.18 / Math.sqrt(intervals.length);
    var now = ctx.currentTime;

    for (var i = 0; i < intervals.length; i++) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = rootFreq * Math.pow(2, intervals[i] / 12);
      osc.type = 'triangle';

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.start(now);
      osc.stop(now + 0.9);
    }
  }

  // ─── GEOMETRY ───
  function noteAngle(index) {
    // Start at 12 o'clock (-π/2), go clockwise
    return -Math.PI / 2 + index * (Math.PI * 2 / 12);
  }

  function notePos(index) {
    var a = noteAngle(index);
    return { x: CX + RADIUS * Math.cos(a), y: CY + RADIUS * Math.sin(a) };
  }

  function labelPos(index) {
    var a = noteAngle(index);
    return { x: CX + LABEL_RADIUS * Math.cos(a), y: CY + LABEL_RADIUS * Math.sin(a) };
  }

  // ─── DRAWING ───
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Circle outline
    ctx.beginPath();
    ctx.arc(CX, CY, RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Completed path lines
    for (var i = 1; i < visitedPath.length; i++) {
      var from = notePos(visitedPath[i - 1]);
      var to = notePos(visitedPath[i]);
      var alpha = 0.12 + 0.38 * (i / visitedPath.length);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Preview line showing the selected interval when idle
    if (!isPlaying && visitedPath.length === 1) {
      var previewFrom = notePos(startNoteIndex);
      var previewTo = notePos((startNoteIndex + stepSize) % 12);
      ctx.beginPath();
      ctx.moveTo(previewFrom.x, previewFrom.y);
      ctx.lineTo(previewTo.x, previewTo.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Animated beam
    if (isPlaying && visitedPath.length > 0) {
      var fromIdx = visitedPath[visitedPath.length - 1];
      var toIdx = (fromIdx + stepSize) % 12;
      var fromP = notePos(fromIdx);
      var toP = notePos(toIdx);

      // Ease function (ease out cubic)
      var t = 1 - Math.pow(1 - animProgress, 3);
      var bx = fromP.x + (toP.x - fromP.x) * t;
      var by = fromP.y + (toP.y - fromP.y) * t;

      // Beam line
      ctx.beginPath();
      ctx.moveTo(fromP.x, fromP.y);
      ctx.lineTo(bx, by);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Beam dot
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // Note dots and labels
    var visitedSet = new Set(visitedPath);
    var previewTarget = (!isPlaying && visitedPath.length === 1) ? (startNoteIndex + stepSize) % 12 : -1;
    for (var n = 0; n < 12; n++) {
      var pos = notePos(n);
      var lpos = labelPos(n);
      var isStart = n === startNoteIndex;
      var isCurrent = n === currentIndex;
      var isVisited = visitedSet.has(n);
      var isPreview = n === previewTarget;

      // Dot
      var dotR = (isCurrent || isStart || isPreview) ? DOT_RADIUS + 2 : DOT_RADIUS;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
      if (isCurrent) {
        ctx.fillStyle = '#fff';
      } else if (isVisited) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      } else if (isPreview) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      } else if (isStart) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      }
      ctx.fill();

      // Glow for current note
      if (isCurrent && isPlaying) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, dotR + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fill();
      }

      // Label
      ctx.font = (isCurrent || isStart || isPreview) ? '600 15px Satoshi, sans-serif' : '400 13px Satoshi, sans-serif';
      ctx.fillStyle = isCurrent ? '#fff' : isVisited ? 'rgba(255, 255, 255, 0.75)' : isPreview ? 'rgba(255, 255, 255, 0.5)' : isStart ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(CIRCLE[n], lpos.x, lpos.y);
    }
  }

  // ─── SEQUENCE DISPLAY ───
  function updateSequence() {
    var container = document.getElementById('sequenceDisplay');
    container.innerHTML = '';

    for (var i = 0; i < visitedPath.length; i++) {
      if (i > 0) {
        var arrow = document.createElement('span');
        arrow.className = 'seq-arrow';
        arrow.textContent = '\u2192';
        container.appendChild(arrow);
      }
      var note = document.createElement('span');
      note.className = 'seq-note';
      if (i === visitedPath.length - 1) note.classList.add('active');
      note.textContent = CIRCLE[visitedPath[i]];
      container.appendChild(note);
    }
  }

  // ─── STEP LOGIC ───
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  function getNumNotes() {
    return 12 / gcd(12, stepSize);
  }

  function stepForward() {
    var nextIndex = (currentIndex + stepSize) % 12;
    currentIndex = nextIndex;
    visitedPath.push(currentIndex);
    playNote(CIRCLE[currentIndex]);
    updateSequence();
    draw();

    // Check if we've returned to start
    if (currentIndex === startNoteIndex && visitedPath.length > 1) {
      if (looping) {
        visitedPath = [startNoteIndex];
        animProgress = 0;
        updateSequence();
      } else {
        stopAnimation();
        updateButtons();
      }
      draw();
    }
  }

  // ─── ANIMATION ───
  function scheduleStep() {
    var beatDuration = 60000 / tempo;
    stepStartTime = performance.now();
    stepTimerId = setTimeout(function () {
      if (!isPlaying) return;
      stepForward();
      if (isPlaying) scheduleStep();
    }, beatDuration);
  }

  function drawLoop() {
    if (!isPlaying) return;
    var beatDuration = 60000 / tempo;
    var elapsed = performance.now() - stepStartTime;
    animProgress = Math.min(elapsed / (beatDuration * 0.75), 1);
    draw();
    animFrameId = requestAnimationFrame(drawLoop);
  }

  // ─── CONTROLS ───
  function hasCompleted() {
    return !isPlaying && visitedPath.length > 1 && currentIndex === startNoteIndex;
  }

  function isMidRun() {
    return isPlaying || (visitedPath.length > 1 && currentIndex !== startNoteIndex);
  }

  function stopAnimation() {
    isPlaying = false;
    clearTimeout(stepTimerId);
    cancelAnimationFrame(animFrameId);
  }

  function play() {
    if (isPlaying) {
      stopAnimation();
      updateButtons();
      draw();
      return;
    }

    // If completed, reset before playing
    if (hasCompleted()) {
      currentIndex = startNoteIndex;
      visitedPath = [startNoteIndex];
      animProgress = 0;
      updateSequence();
    }

    getAudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Play start note
    playNote(CIRCLE[currentIndex]);

    isPlaying = true;
    animProgress = 0;
    updateButtons();
    scheduleStep();
    animFrameId = requestAnimationFrame(drawLoop);
  }

  function reset() {
    stopAnimation();
    currentIndex = startNoteIndex;
    visitedPath = [startNoteIndex];
    animProgress = 0;
    updateButtons();
    updateSequence();
    draw();
  }

  function updateButtons() {
    document.getElementById('playBtn').textContent = isPlaying ? 'Pause' : 'Play';
    document.getElementById('resetBtn').disabled = !isMidRun();
    var loopBtn = document.getElementById('loopBtn');
    if (looping) {
      loopBtn.classList.add('active');
    } else {
      loopBtn.classList.remove('active');
    }
  }

  function updateInfo() {
    var bounceAngle = stepSize <= 6 ? stepSize * 15 : (12 - stepSize) * 15;
    document.getElementById('angleDisplay').textContent = bounceAngle + '\u00B0';
    document.getElementById('intervalDisplay').textContent = INTERVALS[stepSize];
    document.getElementById('notesCountDisplay').textContent = getNumNotes();

    // Build pattern description
    var notes = [];
    var idx = startNoteIndex;
    notes.push(CIRCLE[idx]);
    for (var i = 0; i < getNumNotes(); i++) {
      idx = (idx + stepSize) % 12;
      if (idx === startNoteIndex) break;
      notes.push(CIRCLE[idx]);
    }
    document.getElementById('patternDisplay').textContent = notes.join(' \u2192 ');
  }

  // ─── START NOTE SELECT ───
  function buildStartNoteSelect() {
    var select = document.getElementById('startNoteSelect');
    for (var i = 0; i < 12; i++) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = CIRCLE[i];
      if (i === startNoteIndex) opt.selected = true;
      select.appendChild(opt);
    }
  }

  // ─── EVENT LISTENERS ───
  document.getElementById('stepSlider').addEventListener('input', function () {
    stepSize = parseInt(this.value);
    reset();
    updateInfo();
  });

  document.getElementById('tempoSlider').addEventListener('input', function () {
    tempo = parseInt(this.value);
    document.getElementById('tempoDisplay').textContent = tempo + ' bpm';
  });

  document.getElementById('startNoteSelect').addEventListener('change', function () {
    startNoteIndex = parseInt(this.value);
    reset();
    updateInfo();
  });

  document.getElementById('chordSelect').addEventListener('change', function () {
    chordType = this.value;
  });

  document.getElementById('playBtn').addEventListener('click', play);
  document.getElementById('resetBtn').addEventListener('click', reset);
  document.getElementById('loopBtn').addEventListener('click', function () {
    looping = !looping;
    updateButtons();
  });

  // ─── BUILD TICK MARKS ───
  function buildTickMarks() {
    var wrap = document.getElementById('stepSliderWrap');
    var marks = document.createElement('div');
    marks.className = 'tick-marks';
    for (var i = 1; i <= 11; i++) {
      var tick = document.createElement('div');
      tick.className = 'tick';
      tick.style.left = ((i - 1) / 10 * 100) + '%';
      marks.appendChild(tick);
    }
    wrap.appendChild(marks);
  }

  // ─── INIT ───
  buildStartNoteSelect();
  buildTickMarks();
  updateInfo();
  updateButtons();
  updateSequence();
  draw();
})();
