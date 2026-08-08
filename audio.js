(() => {
  'use strict';

  // These are deliberately small, procedural material sounds rather than a
  // bank of UI beeps. Keeping them in Web Audio means the game stays quick to
  // load, while random offsets and tiny variations keep repeated actions from
  // sounding like the same sampled "ding" every time.
  const SETTINGS_KEY = 'seaside-sushi-shop.settings.v1';
  const DEFAULT_VOLUME = 0.48;
  const MIN_GAIN = 0.0001;
  // Kitchen sounds need enough body to be heard over a phone speaker. This
  // lifts the whole material mix before a soft limiter catches sharp peaks,
  // so the result is fuller rather than brighter or more piercing.
  const FOLEY_GAIN = 1.8;
  // Background music intentionally sits well below the material sounds. It
  // uses its own bus, never the foley boost, so chopping and serving stay in
  // the foreground instead of turning into a wall of sound.
  const MUSIC_OUTPUT_GAIN = 0.56;
  const MUSIC_LOOKAHEAD_SECONDS = 0.34;
  const MUSIC_SCHEDULER_INTERVAL = 78;
  const MUSIC_FADE_SECONDS = 0.56;
  const MUSIC_SCENE_ALIASES = Object.freeze({
    menu: 'menu',
    kitchen: 'service',
    service: 'service',
    fishing: 'other',
    other: 'other',
    none: 'none',
  });
  // Three small, original loops made from soft triangle/sine voices. Keeping
  // the range low and pentatonic avoids the sharp "UI ding" feeling while
  // remaining light enough for a phone browser.
  const MUSIC_TRACKS = Object.freeze({
    menu: Object.freeze({
      tempo: 72,
      stepsPerBar: 8,
      mix: 0.66,
      chords: [[50, 54, 57, 64], [49, 52, 57, 61], [47, 50, 54, 57], [43, 47, 50, 57], [42, 50, 54, 57], [45, 49, 52, 57], [43, 47, 50, 57], [45, 50, 52, 57]],
      bass: [38, 37, 35, 31, 30, 33, 31, 33],
      pulse: [1, 3, 5],
      melody: [[2, 69, 2], [5, 71, 2], [10, 74, 3], [15, 71, 2], [18, 69, 2], [21, 66, 2], [26, 69, 2], [29, 71, 3], [34, 74, 2], [37, 76, 3], [42, 74, 2], [45, 71, 3], [50, 69, 2], [53, 71, 2], [58, 69, 2], [61, 66, 3]],
    }),
    service: Object.freeze({
      tempo: 94,
      stepsPerBar: 8,
      mix: 0.7,
      chords: [[43, 47, 50, 52], [42, 45, 50, 54], [40, 43, 47, 50], [36, 40, 43, 50], [43, 47, 50, 57], [42, 45, 50, 54], [40, 43, 47, 55], [36, 40, 43, 50]],
      bass: [31, 30, 28, 24, 31, 30, 28, 24],
      pulse: [0, 2, 4, 6],
      brush: [2, 6],
      melody: [[4, 71, 2], [7, 74, 2], [12, 76, 2], [15, 74, 2], [20, 71, 2], [23, 69, 2], [28, 71, 2], [31, 74, 3], [36, 74, 2], [39, 76, 2], [44, 78, 2], [47, 76, 2], [52, 74, 2], [55, 71, 2], [60, 69, 2], [63, 71, 3]],
    }),
    other: Object.freeze({
      tempo: 66,
      stepsPerBar: 6,
      mix: 0.58,
      chords: [[45, 49, 52, 59], [44, 47, 52, 56], [42, 45, 49, 52], [38, 42, 45, 49], [45, 49, 52, 59], [44, 47, 52, 56], [42, 45, 49, 52], [38, 42, 45, 49]],
      bass: [33, 32, 30, 26, 33, 32, 30, 26],
      pulse: [0, 3],
      water: [1, 4],
      melody: [[3, 69, 3], [8, 71, 2], [11, 73, 3], [15, 76, 3], [20, 73, 2], [23, 71, 3], [27, 69, 3], [32, 71, 2], [35, 76, 3], [39, 73, 2], [44, 71, 2], [47, 69, 3]],
    }),
  });
  const effectCooldowns = new Map();
  const noiseBuffers = new Map();
  let audioContext = null;
  let masterGain = null;
  let foleyGain = null;
  let foleyToneFilter = null;
  let foleyCompressor = null;
  let musicGain = null;
  let musicToneFilter = null;
  let musicCompressor = null;
  let requestedMusicScene = 'none';
  let activeMusic = null;
  let musicPaused = false;
  let musicWasHidden = false;
  let hasUserGesture = false;
  let settings = readStoredSettings();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max) {
    return min + (Math.random() * (max - min));
  }

  function randomInteger(min, max) {
    return Math.floor(randomBetween(min, max + 1));
  }

  function normalizedVolume(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? clamp(parsed, 0, 0.8) : DEFAULT_VOLUME;
  }

  function readStoredSettings() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY));
      if (!saved || typeof saved !== 'object') return { enabled: true, volume: DEFAULT_VOLUME };
      return {
        enabled: saved.soundEnabled !== false,
        volume: normalizedVolume(saved.soundVolume),
      };
    } catch {
      return { enabled: true, volume: DEFAULT_VOLUME };
    }
  }

  function getContext() {
    // Some mobile browsers reclaim an AudioContext after a long background
    // stay. Forget that closed graph so the next real interaction can build a
    // fresh one instead of leaving the whole sound system permanently silent.
    if (audioContext?.state === 'closed') {
      if (activeMusic?.scheduler !== null) window.clearInterval(activeMusic.scheduler);
      activeMusic = null;
      audioContext = null;
      masterGain = null;
      foleyGain = null;
      foleyToneFilter = null;
      foleyCompressor = null;
      musicGain = null;
      musicToneFilter = null;
      musicCompressor = null;
    }
    if (audioContext) return audioContext;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    try {
      audioContext = new AudioContextConstructor();
      masterGain = audioContext.createGain();
      foleyGain = audioContext.createGain();
      foleyToneFilter = audioContext.createBiquadFilter();
      foleyCompressor = audioContext.createDynamicsCompressor();
      musicGain = audioContext.createGain();
      musicToneFilter = audioContext.createBiquadFilter();
      musicCompressor = audioContext.createDynamicsCompressor();
      foleyToneFilter.type = 'highshelf';
      foleyToneFilter.frequency.value = 2400;
      foleyToneFilter.gain.value = -3.5;
      foleyCompressor.threshold.value = -18;
      foleyCompressor.knee.value = 22;
      foleyCompressor.ratio.value = 5;
      foleyCompressor.attack.value = 0.006;
      foleyCompressor.release.value = 0.22;
      musicToneFilter.type = 'lowpass';
      musicToneFilter.frequency.value = 1850;
      musicToneFilter.Q.value = 0.45;
      musicCompressor.threshold.value = -27;
      musicCompressor.knee.value = 15;
      musicCompressor.ratio.value = 2.2;
      musicCompressor.attack.value = 0.03;
      musicCompressor.release.value = 0.36;
      foleyGain.gain.value = FOLEY_GAIN;
      musicGain.gain.value = MUSIC_OUTPUT_GAIN;
      masterGain.gain.value = settings.enabled ? settings.volume : 0;
      foleyGain.connect(foleyToneFilter);
      foleyToneFilter.connect(foleyCompressor);
      foleyCompressor.connect(masterGain);
      musicGain.connect(musicToneFilter);
      musicToneFilter.connect(musicCompressor);
      musicCompressor.connect(masterGain);
      masterGain.connect(audioContext.destination);
      return audioContext;
    } catch {
      audioContext = null;
      masterGain = null;
      foleyGain = null;
      foleyToneFilter = null;
      foleyCompressor = null;
      musicGain = null;
      musicToneFilter = null;
      musicCompressor = null;
      return null;
    }
  }

  function wake() {
    hasUserGesture = true;
    const context = getContext();
    if (!context) return null;
    const startRequestedMusic = () => window.requestAnimationFrame(() => ensureMusicPlayback());
    if (context.state === 'running') {
      startRequestedMusic();
      return context;
    }
    context.resume?.().then(startRequestedMusic).catch(() => undefined);
    return context;
  }

  function playableContext() {
    if (!hasUserGesture) return null;
    return wake();
  }

  function updateMasterGain() {
    if (!audioContext || !masterGain) return;
    const nextGain = settings.enabled ? settings.volume : 0;
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(nextGain, audioContext.currentTime, 0.028);
  }

  function mayPlay(name, cooldownMs = 55) {
    if (!settings.enabled || document.visibilityState === 'hidden') return false;
    const now = performance.now();
    const nextAllowedAt = effectCooldowns.get(name) ?? 0;
    if (now < nextAllowedAt) return false;
    effectCooldowns.set(name, now + cooldownMs);
    return true;
  }

  function outputEnvelope(context, start, duration, peak = 0.04, attack = 0.005, release = 0.06) {
    const envelope = context.createGain();
    const safeDuration = Math.max(0.008, duration);
    const safeAttack = Math.min(Math.max(0.0025, attack), safeDuration * 0.42);
    const safeRelease = Math.min(Math.max(0.006, release), safeDuration * 0.72);
    const releaseStart = Math.max(start + safeAttack, start + safeDuration - safeRelease);
    const safePeak = Math.max(MIN_GAIN, peak);
    envelope.gain.setValueAtTime(MIN_GAIN, start);
    envelope.gain.exponentialRampToValueAtTime(safePeak, start + safeAttack);
    envelope.gain.setValueAtTime(safePeak, releaseStart);
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, start + safeDuration);
    envelope.connect(foleyGain);
    return envelope;
  }

  function getNoiseBuffer(context, texture = 'white') {
    const cacheKey = `${context.sampleRate}:${texture}`;
    if (noiseBuffers.has(cacheKey)) return noiseBuffers.get(cacheKey);

    const frameCount = Math.floor(context.sampleRate * 2.4);
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let softPrevious = 0;
    let waterPrevious = 0;

    for (let index = 0; index < frameCount; index += 1) {
      const white = (Math.random() * 2) - 1;
      softPrevious = (softPrevious * 0.965) + (white * 0.12);
      waterPrevious = (waterPrevious * 0.78) + (white * 0.46);
      samples[index] = texture === 'soft'
        ? softPrevious
        : texture === 'water'
          ? (waterPrevious * 0.68) + (white * 0.23)
          : white;
    }

    noiseBuffers.set(cacheKey, buffer);
    return buffer;
  }

  function noiseBurst(context, {
    duration = 0.1,
    gain = 0.03,
    lowpass = 1300,
    lowpassEnd = lowpass,
    highpass = 50,
    highpassEnd = highpass,
    q = 0.55,
    attack = 0.004,
    release = 0.07,
    delay = 0,
    texture = 'white',
    rateMin = 0.92,
    rateMax = 1.08,
  } = {}) {
    if (!context || !masterGain) return;
    const start = context.currentTime + Math.max(0, delay);
    const source = context.createBufferSource();
    const highFilter = context.createBiquadFilter();
    const lowFilter = context.createBiquadFilter();
    const envelope = outputEnvelope(context, start, duration, gain, attack, release);
    const buffer = getNoiseBuffer(context, texture);
    const filterVariation = randomBetween(0.9, 1.1);
    const safeLowpass = Math.max(highpass + 45, lowpass * filterVariation);
    const safeLowpassEnd = Math.max(highpassEnd + 45, lowpassEnd * filterVariation);
    const safeHighpass = Math.max(20, highpass * randomBetween(0.92, 1.08));
    const safeHighpassEnd = Math.max(20, highpassEnd * randomBetween(0.92, 1.08));

    source.buffer = buffer;
    source.playbackRate.setValueAtTime(randomBetween(rateMin, rateMax), start);
    highFilter.type = 'highpass';
    highFilter.Q.value = q;
    highFilter.frequency.setValueAtTime(safeHighpass, start);
    highFilter.frequency.exponentialRampToValueAtTime(safeHighpassEnd, start + Math.max(0.01, duration));
    lowFilter.type = 'lowpass';
    lowFilter.Q.value = q;
    lowFilter.frequency.setValueAtTime(safeLowpass, start);
    lowFilter.frequency.exponentialRampToValueAtTime(safeLowpassEnd, start + Math.max(0.01, duration));
    source.connect(highFilter);
    highFilter.connect(lowFilter);
    lowFilter.connect(envelope);

    const maxOffset = Math.max(0.025, buffer.duration - duration - 0.08);
    source.start(start, randomBetween(0.02, maxOffset));
    source.stop(start + duration + 0.025);
  }

  function resonantTap(context, {
    frequencies = [170, 253],
    duration = 0.065,
    gain = 0.008,
    delay = 0,
    attack = 0.0015,
    release = 0.052,
  } = {}) {
    if (!context || !masterGain) return;
    const start = context.currentTime + Math.max(0, delay);
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const envelope = outputEnvelope(
        context,
        start + (index * 0.0015),
        duration * randomBetween(0.84, 1.1),
        gain / Math.max(1, frequencies.length),
        attack,
        release,
      );
      const startingFrequency = Math.max(38, frequency * randomBetween(0.96, 1.04));
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(startingFrequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, startingFrequency * randomBetween(0.86, 0.94)), start + duration);
      oscillator.connect(envelope);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.018);
    });
  }

  function grainCluster(context, {
    count = 5,
    spread = 0.09,
    gain = 0.012,
    lowpass = 2600,
    highpass = 640,
    delay = 0,
    texture = 'white',
  } = {}) {
    for (let index = 0; index < count; index += 1) {
      noiseBurst(context, {
        duration: randomBetween(0.009, 0.021),
        gain: gain * randomBetween(0.66, 1.12),
        lowpass: lowpass * randomBetween(0.84, 1.1),
        highpass: highpass * randomBetween(0.86, 1.08),
        attack: 0.0035,
        release: randomBetween(0.012, 0.024),
        delay: delay + randomBetween(0, spread),
        texture,
        rateMin: 0.88,
        rateMax: 1.16,
      });
    }
  }

  function buttonTouch(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.032,
      gain: 0.012,
      lowpass: 900,
      highpass: 150,
      attack: 0.004,
      release: 0.03,
      delay,
      texture: 'soft',
    });
  }

  function fridgeDoor(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.16,
      gain: 0.026,
      lowpass: 920,
      lowpassEnd: 520,
      highpass: 75,
      attack: 0.008,
      release: 0.12,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.042,
      gain: 0.009,
      lowpass: 1120,
      highpass: 120,
      attack: 0.006,
      release: 0.035,
      delay: delay + 0.108,
      texture: 'soft',
    });
  }

  function counterSetDown(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.048,
      gain: 0.03,
      lowpass: 860,
      highpass: 70,
      attack: 0.002,
      release: 0.04,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.028,
      gain: 0.006,
      lowpass: 1180,
      highpass: 190,
      attack: 0.004,
      release: 0.023,
      delay: delay + 0.008,
      texture: 'soft',
    });
  }

  function riceScatter(context, delay = 0) {
    grainCluster(context, {
      count: randomInteger(4, 7),
      spread: 0.11,
      gain: 0.008,
      lowpass: 2100,
      highpass: 440,
      delay,
    });
    noiseBurst(context, {
      duration: 0.07,
      gain: 0.007,
      lowpass: 1050,
      highpass: 120,
      attack: 0.009,
      release: 0.055,
      delay: delay + 0.012,
      texture: 'soft',
    });
  }

  function knifeOnBoard(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.021,
      gain: 0.036,
      lowpass: 2500,
      highpass: 430,
      attack: 0.002,
      release: 0.018,
      delay,
    });
    noiseBurst(context, {
      duration: 0.058,
      gain: 0.022,
      lowpass: 760,
      highpass: 65,
      attack: 0.002,
      release: 0.052,
      delay: delay + 0.004,
      texture: 'soft',
    });
  }

  function shrimpTrim(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.022,
      gain: 0.042,
      lowpass: 1850,
      highpass: 190,
      attack: 0.002,
      release: 0.018,
      delay,
      texture: 'water',
    });
    noiseBurst(context, {
      duration: 0.078,
      gain: 0.018,
      lowpass: 720,
      highpass: 75,
      attack: 0.004,
      release: 0.07,
      delay: delay + 0.01,
      texture: 'soft',
    });
  }

  function shapeSushi(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.13,
      gain: 0.016,
      lowpass: 920,
      highpass: 95,
      attack: 0.014,
      release: 0.1,
      delay,
      texture: 'soft',
    });
    grainCluster(context, {
      count: randomInteger(2, 3),
      spread: 0.08,
      gain: 0.0045,
      lowpass: 1850,
      highpass: 550,
      delay: delay + 0.028,
      texture: 'soft',
    });
  }

  function pourTea(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.56,
      gain: 0.028,
      lowpass: 1500,
      lowpassEnd: 700,
      highpass: 135,
      highpassEnd: 190,
      attack: 0.035,
      release: 0.22,
      delay,
      texture: 'water',
      rateMin: 0.94,
      rateMax: 1.05,
    });
    grainCluster(context, {
      count: randomInteger(2, 4),
      spread: 0.4,
      gain: 0.004,
      lowpass: 2400,
      highpass: 650,
      delay: delay + 0.07,
      texture: 'water',
    });
  }

  function teaCupReady(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.038,
      gain: 0.009,
      lowpass: 1650,
      highpass: 340,
      attack: 0.005,
      release: 0.032,
      delay,
      texture: 'soft',
    });
    resonantTap(context, { frequencies: [340, 510], duration: 0.055, gain: 0.0025, delay: delay + 0.005 });
  }

  function serveDish(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.075,
      gain: 0.019,
      lowpass: 900,
      highpass: 70,
      attack: 0.006,
      release: 0.066,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.045,
      gain: 0.008,
      lowpass: 1050,
      highpass: 110,
      attack: 0.006,
      release: 0.038,
      delay: delay + 0.045,
      texture: 'soft',
    });
  }

  function receiptAndDrawer(context, delay = 0, gain = 1) {
    noiseBurst(context, {
      duration: 0.1,
      gain: 0.012 * gain,
      lowpass: 1900,
      highpass: 190,
      attack: 0.008,
      release: 0.09,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.038,
      gain: 0.02 * gain,
      lowpass: 1300,
      highpass: 130,
      attack: 0.002,
      release: 0.032,
      delay: delay + 0.07,
      texture: 'soft',
    });
  }

  function trashDrop(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.13,
      gain: 0.03,
      lowpass: 950,
      highpass: 58,
      attack: 0.006,
      release: 0.12,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.085,
      gain: 0.008,
      lowpass: 980,
      highpass: 95,
      attack: 0.008,
      release: 0.075,
      delay: delay + 0.022,
      texture: 'soft',
    });
  }

  function footsteps(context, delay = 0, leaving = false) {
    const firstDelay = delay + (leaving ? 0.025 : 0);
    [firstDelay, firstDelay + randomBetween(0.095, 0.14)].forEach((stepDelay, index) => {
      noiseBurst(context, {
        duration: randomBetween(0.036, 0.052),
        gain: 0.011 - (index * 0.0015),
        lowpass: 640,
        highpass: 80,
        attack: 0.004,
        release: 0.037,
        delay: stepDelay,
        texture: 'soft',
      });
      noiseBurst(context, {
        duration: 0.03,
        gain: 0.006,
        lowpass: 1400,
        highpass: 280,
        attack: 0.003,
        release: 0.026,
        delay: stepDelay + 0.004,
      });
    });
  }

  function dayTransition(context, delay = 0, opening = false) {
    noiseBurst(context, {
      duration: opening ? 0.17 : 0.2,
      gain: opening ? 0.016 : 0.019,
      lowpass: opening ? 700 : 820,
      lowpassEnd: opening ? 1100 : 470,
      highpass: 65,
      attack: 0.015,
      release: 0.14,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.03,
      gain: 0.01,
      lowpass: 1450,
      highpass: 250,
      attack: 0.003,
      release: 0.025,
      delay: delay + (opening ? 0.115 : 0.09),
    });
  }

  function waterSplash(context, delay = 0, strength = 1) {
    noiseBurst(context, {
      duration: 0.22,
      gain: 0.048 * strength,
      lowpass: 1450,
      lowpassEnd: 720,
      highpass: 60,
      attack: 0.005,
      release: 0.2,
      delay,
      texture: 'water',
    });
    noiseBurst(context, {
      duration: 0.072,
      gain: 0.012 * strength,
      lowpass: 1350,
      highpass: 110,
      attack: 0.009,
      release: 0.075,
      delay: delay + 0.012,
      texture: 'water',
    });
    grainCluster(context, {
      count: randomInteger(1, 3),
      spread: 0.15,
      gain: 0.0035 * strength,
      lowpass: 1450,
      highpass: 220,
      delay: delay + 0.03,
      texture: 'water',
    });
  }

  function castLine(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.2,
      gain: 0.017,
      lowpass: 1900,
      lowpassEnd: 800,
      highpass: 140,
      attack: 0.02,
      release: 0.16,
      delay,
      texture: 'soft',
    });
    waterSplash(context, delay + 0.09, 0.42);
  }

  function hookClick(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.034,
      gain: 0.009,
      lowpass: 1150,
      highpass: 160,
      attack: 0.005,
      release: 0.028,
      delay,
      texture: 'soft',
    });
    resonantTap(context, { frequencies: [175, 270], duration: 0.05, gain: 0.0018, delay: delay + 0.004 });
  }

  function reelGears(context, delay = 0) {
    const steps = randomInteger(2, 3);
    for (let index = 0; index < steps; index += 1) {
      const clickDelay = delay + (index * randomBetween(0.038, 0.066));
      noiseBurst(context, {
        duration: 0.024,
        gain: 0.007,
        lowpass: 1050,
        highpass: 130,
        attack: 0.004,
        release: 0.021,
        delay: clickDelay,
        texture: 'soft',
      });
      resonantTap(context, { frequencies: [145, 215], duration: 0.03, gain: 0.0014, delay: clickDelay });
    }
  }

  function fishingFinish(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.14,
      gain: 0.016,
      lowpass: 1050,
      highpass: 90,
      attack: 0.01,
      release: 0.12,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.05,
      gain: 0.008,
      lowpass: 900,
      highpass: 100,
      attack: 0.008,
      release: 0.04,
      delay: delay + 0.065,
      texture: 'soft',
    });
  }

  function midiFrequency(midi) {
    return 440 * (2 ** ((midi - 69) / 12));
  }

  function rememberMusicSource(player, source) {
    player.sources.add(source);
    source.addEventListener('ended', () => player.sources.delete(source), { once: true });
  }

  function createMusicEnvelope(player, start, duration, peak, attack, release) {
    const context = player.context;
    const envelope = context.createGain();
    const safeDuration = Math.max(0.07, duration);
    const safeAttack = Math.min(Math.max(0.012, attack), safeDuration * 0.34);
    const safeRelease = Math.min(Math.max(0.09, release), safeDuration * 0.66);
    const peakAt = start + safeAttack;
    const releaseAt = Math.max(peakAt, start + safeDuration - safeRelease);

    envelope.gain.setValueAtTime(MIN_GAIN, start);
    envelope.gain.exponentialRampToValueAtTime(Math.max(MIN_GAIN, peak), peakAt);
    envelope.gain.setValueAtTime(Math.max(MIN_GAIN, peak), releaseAt);
    envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, start + safeDuration);
    envelope.connect(player.bus);
    return envelope;
  }

  function scheduleMusicTone(player, midi, start, duration, {
    type = 'triangle',
    gain = 0.032,
    attack = 0.02,
    release = 0.28,
    lowpass = 1500,
    detune = 0,
  } = {}) {
    if (player.stopped || !Number.isFinite(midi)) return;
    const context = player.context;
    const oscillator = context.createOscillator();
    const toneFilter = context.createBiquadFilter();
    const envelope = createMusicEnvelope(player, start, duration, gain, attack, release);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(midiFrequency(midi), start);
    oscillator.detune.setValueAtTime(detune, start);
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(lowpass, start);
    toneFilter.Q.value = 0.32;
    oscillator.connect(toneFilter);
    toneFilter.connect(envelope);

    oscillator.addEventListener('ended', () => {
      toneFilter.disconnect();
      envelope.disconnect();
    }, { once: true });

    oscillator.start(start);
    oscillator.stop(start + Math.max(0.07, duration) + 0.07);
    rememberMusicSource(player, oscillator);
  }

  function scheduleMusicNoise(player, start, duration, {
    gain = 0.004,
    lowpass = 1100,
    highpass = 110,
    attack = 0.04,
    release = 0.2,
    texture = 'soft',
  } = {}) {
    if (player.stopped) return;
    const context = player.context;
    const source = context.createBufferSource();
    const highFilter = context.createBiquadFilter();
    const lowFilter = context.createBiquadFilter();
    const envelope = createMusicEnvelope(player, start, duration, gain, attack, release);

    source.buffer = getNoiseBuffer(context, texture);
    highFilter.type = 'highpass';
    highFilter.frequency.value = highpass;
    highFilter.Q.value = 0.38;
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = lowpass;
    lowFilter.Q.value = 0.36;
    source.connect(highFilter);
    highFilter.connect(lowFilter);
    lowFilter.connect(envelope);

    source.addEventListener('ended', () => {
      highFilter.disconnect();
      lowFilter.disconnect();
      envelope.disconnect();
    }, { once: true });

    const maxOffset = Math.max(0.02, source.buffer.duration - duration - 0.03);
    source.start(start, randomBetween(0.01, maxOffset));
    source.stop(start + Math.max(0.07, duration) + 0.06);
    rememberMusicSource(player, source);
  }

  function scheduleMusicPad(player, chord, start, duration) {
    chord.forEach((midi, index) => {
      const chordGain = 0.053 / chord.length;
      scheduleMusicTone(player, midi, start, duration, {
        type: 'sine',
        gain: chordGain,
        attack: 0.18,
        release: 0.7,
        lowpass: 1160,
      });
      // A very quiet triangle layer gives the pad a wood-and-paper warmth
      // rather than a pure electronic tone.
      if (index === chord.length - 1 || index === 1) {
        scheduleMusicTone(player, midi, start + 0.012, duration * 0.94, {
          type: 'triangle',
          gain: chordGain * 0.34,
          attack: 0.13,
          release: 0.56,
          lowpass: 1280,
          detune: index === 1 ? -4 : 4,
        });
      }
    });
  }

  function scheduleMusicBass(player, midi, start, duration) {
    scheduleMusicTone(player, midi, start, duration, {
      type: 'sine',
      gain: 0.068,
      attack: 0.026,
      release: 0.32,
      lowpass: 560,
    });
    scheduleMusicTone(player, midi + 12, start + 0.008, duration * 0.76, {
      type: 'triangle',
      gain: 0.012,
      attack: 0.03,
      release: 0.24,
      lowpass: 720,
    });
  }

  function scheduleMusicPluck(player, midi, start, duration, isService = false) {
    scheduleMusicTone(player, midi, start, duration, {
      type: 'triangle',
      gain: isService ? 0.048 : 0.043,
      attack: 0.018,
      release: isService ? 0.26 : 0.34,
      lowpass: isService ? 1320 : 1180,
    });
    scheduleMusicTone(player, midi + 12, start + 0.006, duration * 0.72, {
      type: 'sine',
      gain: 0.009,
      attack: 0.025,
      release: 0.22,
      lowpass: 1500,
      detune: 5,
    });
  }

  function musicTrackForScene(scene) {
    return MUSIC_SCENE_ALIASES[scene] ?? 'none';
  }

  function scheduleMusicStep(player) {
    const track = player.track;
    const stepInLoop = player.stepIndex % player.loopSteps;
    const barIndex = Math.floor(stepInLoop / track.stepsPerBar);
    const stepInBar = stepInLoop % track.stepsPerBar;
    const start = player.nextStepAt;
    const chord = track.chords[barIndex % track.chords.length];
    const stepDuration = player.stepDuration;

    if (stepInBar === 0) {
      scheduleMusicPad(player, chord, start, stepDuration * (track.stepsPerBar - 0.28));
      scheduleMusicBass(player, track.bass[barIndex % track.bass.length], start, stepDuration * Math.min(3.8, track.stepsPerBar * 0.56));
    }

    if (track.pulse.includes(stepInBar)) {
      const chordIndex = (barIndex + stepInBar) % chord.length;
      const upperRegister = stepInBar === track.pulse[track.pulse.length - 1] ? 12 : 0;
      scheduleMusicPluck(player, chord[chordIndex] + upperRegister, start, stepDuration * 0.9, player.id === 'service');
    }

    if (track.brush?.includes(stepInBar)) {
      scheduleMusicNoise(player, start, stepDuration * 0.72, {
        gain: 0.0033,
        lowpass: 1220,
        highpass: 360,
        attack: 0.022,
        release: 0.13,
      });
    }

    if (track.water?.includes(stepInBar)) {
      scheduleMusicNoise(player, start, stepDuration * 2.1, {
        gain: 0.0052,
        lowpass: 690,
        highpass: 95,
        attack: 0.16,
        release: 0.42,
        texture: 'water',
      });
    }

    track.melody.forEach(([step, midi, length]) => {
      if (step !== stepInLoop) return;
      scheduleMusicPluck(player, midi, start, stepDuration * length, player.id === 'service');
    });
  }

  function scheduleMusic(player) {
    if (activeMusic !== player || player.stopped || musicPaused || document.hidden || !settings.enabled) return;
    const now = player.context.currentTime;
    // Do not play a whole queue of stale notes after the browser briefly
    // stalls. Advance to the current beat, then let the loop continue cleanly.
    if (player.nextStepAt < now - 0.08) {
      const skippedSteps = Math.floor((now - player.nextStepAt) / player.stepDuration) + 1;
      player.nextStepAt += skippedSteps * player.stepDuration;
      player.stepIndex += skippedSteps;
    }
    while (player.nextStepAt < now + MUSIC_LOOKAHEAD_SECONDS) {
      scheduleMusicStep(player);
      player.nextStepAt += player.stepDuration;
      player.stepIndex += 1;
    }
  }

  function stopMusicPlayer(player, duration = MUSIC_FADE_SECONDS) {
    if (!player || player.stopped) return;
    player.stopped = true;
    if (player.scheduler !== null) window.clearInterval(player.scheduler);
    const now = player.context.currentTime;
    const fade = Math.max(0.025, duration);
    player.bus.gain.cancelScheduledValues(now);
    player.duckGain.gain.cancelScheduledValues(now);
    player.bus.gain.setTargetAtTime(MIN_GAIN, now, Math.max(0.018, fade / 4));
    player.duckGain.gain.setTargetAtTime(MIN_GAIN, now, Math.max(0.018, fade / 4));
    window.setTimeout(() => {
      player.sources.forEach((source) => {
        try {
          source.stop(player.context.currentTime + 0.005);
        } catch {
          // A short one-shot may already have finished.
        }
      });
      player.sources.clear();
      player.bus.disconnect();
      player.duckGain.disconnect();
    }, (fade + 0.16) * 1000);
  }

  function stopMusic({ forget = false, duration = MUSIC_FADE_SECONDS } = {}) {
    if (forget) requestedMusicScene = 'none';
    const player = activeMusic;
    activeMusic = null;
    stopMusicPlayer(player, duration);
  }

  function startMusic(trackId) {
    if (!audioContext || !musicGain || !MUSIC_TRACKS[trackId]) return;
    if (activeMusic?.id === trackId && !activeMusic.stopped) return;
    stopMusic({ duration: MUSIC_FADE_SECONDS });

    const track = MUSIC_TRACKS[trackId];
    const context = audioContext;
    const bus = context.createGain();
    const duckGain = context.createGain();
    bus.gain.setValueAtTime(MIN_GAIN, context.currentTime);
    bus.gain.setTargetAtTime(track.mix, context.currentTime, MUSIC_FADE_SECONDS / 3);
    duckGain.gain.value = 1;
    bus.connect(duckGain);
    duckGain.connect(musicGain);

    const player = {
      id: trackId,
      track,
      context,
      bus,
      duckGain,
      sources: new Set(),
      nextStepAt: context.currentTime + 0.08,
      stepDuration: 60 / track.tempo / 2,
      loopSteps: track.chords.length * track.stepsPerBar,
      stepIndex: 0,
      scheduler: null,
      stopped: false,
    };
    activeMusic = player;
    scheduleMusic(player);
    player.scheduler = window.setInterval(() => scheduleMusic(player), MUSIC_SCHEDULER_INTERVAL);
  }

  function ensureMusicPlayback() {
    if (!hasUserGesture || musicPaused || document.hidden || !settings.enabled) return;
    const trackId = musicTrackForScene(requestedMusicScene);
    if (trackId === 'none') {
      stopMusic();
      return;
    }
    const context = getContext();
    if (!context || context.state !== 'running') return;
    startMusic(trackId);
  }

  function setMusicScene(scene = 'none') {
    requestedMusicScene = musicTrackForScene(scene);
    musicPaused = false;
    if (requestedMusicScene === 'none') stopMusic();
    else ensureMusicPlayback();
    return requestedMusicScene;
  }

  function pauseMusic() {
    musicPaused = true;
    stopMusic({ duration: 0.24 });
  }

  function resumeMusic() {
    musicPaused = false;
    ensureMusicPlayback();
  }

  function duckMusic() {
    const player = activeMusic;
    if (!player || player.stopped) return;
    const now = player.context.currentTime;
    player.duckGain.gain.cancelScheduledValues(now);
    player.duckGain.gain.setTargetAtTime(0.72, now, 0.038);
    player.duckGain.gain.setTargetAtTime(1, now + 0.14, 0.23);
  }

  function handleMusicVisibility() {
    if (document.hidden) {
      musicWasHidden = requestedMusicScene !== 'none';
      stopMusic({ duration: 0.16 });
      return;
    }
    if (!musicWasHidden) return;
    musicWasHidden = false;
    ensureMusicPlayback();
  }

  function play(name) {
    const cooldown = {
      chop: 75,
      shrimp: 85,
      rice: 105,
      sushi: 135,
      teaStart: 300,
      teaReady: 160,
      customerIn: 420,
      customerOut: 260,
      cast: 300,
      hook: 240,
      reel: 95,
      splash: 260,
      ui: 70,
    }[name] ?? 65;
    if (!mayPlay(name, cooldown)) return false;

    const context = playableContext();
    if (!context || !masterGain) return false;
    const start = context.currentTime + 0.006;
    if (['serve', 'cash', 'purchase', 'dayStart', 'dayEnd', 'cast', 'finish'].includes(name)) duckMusic();

    switch (name) {
      case 'ui':
        buttonTouch(context, start - context.currentTime);
        break;
      case 'freezer':
        fridgeDoor(context, start - context.currentTime);
        break;
      case 'place':
        counterSetDown(context, start - context.currentTime);
        break;
      case 'rice':
        riceScatter(context, start - context.currentTime);
        break;
      case 'chop':
        knifeOnBoard(context, start - context.currentTime);
        break;
      case 'shrimp':
        shrimpTrim(context, start - context.currentTime);
        break;
      case 'sushi':
        shapeSushi(context, start - context.currentTime);
        break;
      case 'teaStart':
        pourTea(context, start - context.currentTime);
        break;
      case 'teaReady':
        teaCupReady(context, start - context.currentTime);
        break;
      case 'serve':
        serveDish(context, start - context.currentTime);
        break;
      case 'cash':
        // A completed order first lands on the table, then the receipt/drawer
        // follows. This avoids two impacts turning into a UI notification.
        receiptAndDrawer(context, (start - context.currentTime) + 0.105, 1);
        break;
      case 'purchase':
        receiptAndDrawer(context, start - context.currentTime, 0.88);
        break;
      case 'trash':
        trashDrop(context, start - context.currentTime);
        break;
      case 'customerIn':
        footsteps(context, start - context.currentTime, false);
        break;
      case 'customerOut':
        footsteps(context, start - context.currentTime, true);
        break;
      case 'dayEnd':
        dayTransition(context, start - context.currentTime, false);
        break;
      case 'dayStart':
        dayTransition(context, start - context.currentTime, true);
        break;
      case 'cast':
        castLine(context, start - context.currentTime);
        break;
      case 'hook':
        hookClick(context, start - context.currentTime);
        break;
      case 'reel':
        reelGears(context, start - context.currentTime);
        break;
      case 'splash':
        waterSplash(context, start - context.currentTime, 1);
        break;
      case 'finish':
        fishingFinish(context, start - context.currentTime);
        break;
      default:
        return false;
    }
    return true;
  }

  function configure(next = {}) {
    const wasEnabled = settings.enabled;
    if (typeof next.enabled === 'boolean') settings.enabled = next.enabled;
    if (Object.prototype.hasOwnProperty.call(next, 'volume')) settings.volume = normalizedVolume(next.volume);
    updateMasterGain();
    if (!settings.enabled) stopMusic({ duration: 0.12 });
    else if (!wasEnabled || hasUserGesture) ensureMusicPlayback();
    return getSettings();
  }

  function getSettings() {
    return { enabled: settings.enabled, volume: settings.volume };
  }

  function stop() {
    stopMusic({ duration: 0.02 });
    if (!masterGain || !audioContext) return;
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.02);
  }

  function restoreAfterPageShow(event) {
    if (!event.persisted) return;
    updateMasterGain();
    if (!audioContext || !hasUserGesture) return;
    const resumeMusicAfterRestore = () => ensureMusicPlayback();
    if (audioContext.state === 'running') {
      resumeMusicAfterRestore();
      return;
    }
    audioContext.resume?.().then(resumeMusicAfterRestore).catch(() => undefined);
  }

  window.SeasideSushiAudio = Object.freeze({
    play,
    wake,
    configure,
    getSettings,
    setMusicScene,
    pauseMusic,
    resumeMusic,
    stopMusic,
    stop,
  });

  // The browser only allows sound after a genuine interaction. Waking quietly
  // on that first interaction lets delayed customer and animation sounds work
  // naturally without an extra permission prompt.
  window.addEventListener('pointerdown', wake, { capture: true, passive: true, once: true });
  window.addEventListener('keydown', wake, { capture: true, once: true });
  document.addEventListener('visibilitychange', handleMusicVisibility);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', restoreAfterPageShow);
})();
