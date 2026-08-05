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
  const effectCooldowns = new Map();
  const noiseBuffers = new Map();
  let audioContext = null;
  let masterGain = null;
  let foleyGain = null;
  let foleyCompressor = null;
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
    if (audioContext) return audioContext;
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) return null;

    try {
      audioContext = new AudioContextConstructor();
      masterGain = audioContext.createGain();
      foleyGain = audioContext.createGain();
      foleyCompressor = audioContext.createDynamicsCompressor();
      foleyCompressor.threshold.value = -18;
      foleyCompressor.knee.value = 22;
      foleyCompressor.ratio.value = 5;
      foleyCompressor.attack.value = 0.006;
      foleyCompressor.release.value = 0.22;
      foleyGain.gain.value = FOLEY_GAIN;
      masterGain.gain.value = settings.enabled ? settings.volume : 0;
      foleyGain.connect(foleyCompressor);
      foleyCompressor.connect(masterGain);
      masterGain.connect(audioContext.destination);
      return audioContext;
    } catch {
      audioContext = null;
      masterGain = null;
      foleyGain = null;
      foleyCompressor = null;
      return null;
    }
  }

  function wake() {
    hasUserGesture = true;
    const context = getContext();
    if (!context || context.state === 'running') return context;
    context.resume?.().catch(() => undefined);
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
    const safeAttack = Math.min(Math.max(0.001, attack), safeDuration * 0.42);
    const safeRelease = Math.min(Math.max(0.004, release), safeDuration * 0.72);
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
        attack: 0.0015,
        release: randomBetween(0.008, 0.02),
        delay: delay + randomBetween(0, spread),
        texture,
        rateMin: 0.88,
        rateMax: 1.16,
      });
    }
  }

  function buttonTouch(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.022,
      gain: 0.011,
      lowpass: 1150,
      highpass: 260,
      attack: 0.0015,
      release: 0.018,
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
      duration: 0.024,
      gain: 0.018,
      lowpass: 2100,
      highpass: 360,
      attack: 0.0015,
      release: 0.019,
      delay: delay + 0.108,
    });
    resonantTap(context, { frequencies: [310, 471], duration: 0.045, gain: 0.004, delay: delay + 0.107 });
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
      duration: 0.018,
      gain: 0.009,
      lowpass: 1650,
      highpass: 390,
      attack: 0.0015,
      release: 0.014,
      delay: delay + 0.008,
    });
  }

  function riceScatter(context, delay = 0) {
    grainCluster(context, {
      count: randomInteger(4, 7),
      spread: 0.11,
      gain: 0.012,
      lowpass: 2800,
      highpass: 700,
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
      duration: 0.016,
      gain: 0.064,
      lowpass: 3900,
      highpass: 720,
      attack: 0.001,
      release: 0.013,
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
      duration: 0.022,
      gain: 0.021,
      lowpass: 3300,
      highpass: 800,
      attack: 0.0015,
      release: 0.019,
      delay,
    });
    resonantTap(context, { frequencies: [790, 1270], duration: 0.052, gain: 0.006, delay: delay + 0.004 });
  }

  function serveDish(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.075,
      gain: 0.017,
      lowpass: 900,
      highpass: 70,
      attack: 0.006,
      release: 0.066,
      delay,
      texture: 'soft',
    });
    noiseBurst(context, {
      duration: 0.019,
      gain: 0.019,
      lowpass: 3000,
      highpass: 720,
      attack: 0.0015,
      release: 0.016,
      delay: delay + 0.045,
    });
    resonantTap(context, { frequencies: [238, 379], duration: 0.04, gain: 0.0035, delay: delay + 0.045 });
  }

  function receiptAndDrawer(context, delay = 0, gain = 1) {
    noiseBurst(context, {
      duration: 0.1,
      gain: 0.021 * gain,
      lowpass: 3150,
      highpass: 430,
      attack: 0.004,
      release: 0.09,
      delay,
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
      duration: 0.058,
      gain: 0.017,
      lowpass: 2400,
      highpass: 380,
      attack: 0.003,
      release: 0.05,
      delay: delay + 0.022,
    });
    resonantTap(context, { frequencies: [158, 241], duration: 0.075, gain: 0.0035, delay: delay + 0.027 });
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
      gain: 0.028 * strength,
      lowpass: 3000,
      highpass: 330,
      attack: 0.002,
      release: 0.064,
      delay: delay + 0.012,
      texture: 'water',
    });
    grainCluster(context, {
      count: randomInteger(2, 4),
      spread: 0.15,
      gain: 0.006 * strength,
      lowpass: 2400,
      highpass: 470,
      delay: delay + 0.03,
      texture: 'water',
    });
  }

  function castLine(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.18,
      gain: 0.03,
      lowpass: 3600,
      lowpassEnd: 1300,
      highpass: 350,
      attack: 0.008,
      release: 0.15,
      delay,
    });
    waterSplash(context, delay + 0.09, 0.42);
  }

  function hookClick(context, delay = 0) {
    noiseBurst(context, {
      duration: 0.019,
      gain: 0.032,
      lowpass: 3100,
      highpass: 720,
      attack: 0.001,
      release: 0.016,
      delay,
    });
    resonantTap(context, { frequencies: [430, 689], duration: 0.047, gain: 0.005, delay: delay + 0.003 });
  }

  function reelGears(context, delay = 0) {
    const steps = randomInteger(2, 3);
    for (let index = 0; index < steps; index += 1) {
      const clickDelay = delay + (index * randomBetween(0.038, 0.066));
      noiseBurst(context, {
        duration: 0.013,
        gain: 0.016,
        lowpass: 2600,
        highpass: 460,
        attack: 0.001,
        release: 0.011,
        delay: clickDelay,
      });
      resonantTap(context, { frequencies: [198, 322], duration: 0.026, gain: 0.0025, delay: clickDelay });
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
    hookClick(context, delay + 0.065);
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
    if (typeof next.enabled === 'boolean') settings.enabled = next.enabled;
    if (Object.prototype.hasOwnProperty.call(next, 'volume')) settings.volume = normalizedVolume(next.volume);
    updateMasterGain();
    return getSettings();
  }

  function getSettings() {
    return { enabled: settings.enabled, volume: settings.volume };
  }

  function stop() {
    if (!masterGain || !audioContext) return;
    masterGain.gain.cancelScheduledValues(audioContext.currentTime);
    masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.02);
  }

  window.SeasideSushiAudio = Object.freeze({
    play,
    wake,
    configure,
    getSettings,
    stop,
  });

  // The browser only allows sound after a genuine interaction. Waking quietly
  // on that first interaction lets delayed customer and animation sounds work
  // naturally without an extra permission prompt.
  window.addEventListener('pointerdown', wake, { capture: true, passive: true, once: true });
  window.addEventListener('keydown', wake, { capture: true, once: true });
  window.addEventListener('pagehide', stop, { once: true });
})();
