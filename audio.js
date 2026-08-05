(() => {
  'use strict';

  // Short procedural foley keeps the game light to load and avoids licensing
  // issues with downloaded sound packs. Every effect is deliberately filtered
  // and quiet: the goal is a nearby kitchen sound, never a notification beep.
  const SETTINGS_KEY = 'seaside-sushi-shop.settings.v1';
  const DEFAULT_VOLUME = 0.32;
  const MIN_GAIN = 0.0001;
  const effectCooldowns = new Map();
  let audioContext = null;
  let masterGain = null;
  let noiseBuffer = null;
  let hasUserGesture = false;
  let settings = readStoredSettings();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalizedVolume(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? clamp(parsed, 0, 0.7) : DEFAULT_VOLUME;
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
      masterGain.gain.value = settings.enabled ? settings.volume : 0;
      masterGain.connect(audioContext.destination);
      return audioContext;
    } catch {
      audioContext = null;
      masterGain = null;
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
    const context = audioContext;
    if (!context || !masterGain) return;
    const nextGain = settings.enabled ? settings.volume : 0;
    masterGain.gain.cancelScheduledValues(context.currentTime);
    masterGain.gain.setTargetAtTime(nextGain, context.currentTime, 0.028);
  }

  function mayPlay(name, cooldownMs = 55) {
    if (!settings.enabled || document.visibilityState === 'hidden') return false;
    const now = performance.now();
    const nextAllowedAt = effectCooldowns.get(name) ?? 0;
    if (now < nextAllowedAt) return false;
    effectCooldowns.set(name, now + cooldownMs);
    return true;
  }

  function outputEnvelope(context, start, duration, peak = 0.1, attack = 0.012, release = 0.08) {
    const gain = context.createGain();
    const releaseStart = Math.max(start + attack, start + duration - release);
    gain.gain.setValueAtTime(MIN_GAIN, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(MIN_GAIN, peak), start + attack);
    gain.gain.setValueAtTime(Math.max(MIN_GAIN, peak), releaseStart);
    gain.gain.exponentialRampToValueAtTime(MIN_GAIN, start + duration);
    gain.connect(masterGain);
    return gain;
  }

  function tone({
    frequency = 220,
    endFrequency = frequency,
    duration = 0.12,
    gain = 0.08,
    type = 'sine',
    attack = 0.01,
    release = 0.08,
    delay = 0,
  } = {}) {
    const context = playableContext();
    if (!context || !masterGain) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = outputEnvelope(context, start, duration, gain, attack, release);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(35, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, endFrequency), start + duration);
    oscillator.connect(envelope);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function getNoiseBuffer(context) {
    if (noiseBuffer?.sampleRate === context.sampleRate) return noiseBuffer;
    const frameCount = context.sampleRate;
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < frameCount; index += 1) {
      const white = (Math.random() * 2) - 1;
      previous = (previous * 0.93) + (white * 0.12);
      samples[index] = previous;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  function noise({
    duration = 0.13,
    gain = 0.06,
    lowpass = 1300,
    highpass = 55,
    attack = 0.006,
    release = 0.09,
    delay = 0,
  } = {}) {
    const context = playableContext();
    if (!context || !masterGain) return;
    const start = context.currentTime + delay;
    const source = context.createBufferSource();
    const highFilter = context.createBiquadFilter();
    const lowFilter = context.createBiquadFilter();
    const envelope = outputEnvelope(context, start, duration, gain, attack, release);
    source.buffer = getNoiseBuffer(context);
    highFilter.type = 'highpass';
    highFilter.frequency.value = Math.max(20, highpass);
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = Math.max(highpass + 30, lowpass);
    lowFilter.Q.value = 0.55;
    source.connect(highFilter);
    highFilter.connect(lowFilter);
    lowFilter.connect(envelope);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  function softThump({ gain = 0.075, delay = 0, wood = false } = {}) {
    tone({
      frequency: wood ? 170 : 120,
      endFrequency: wood ? 105 : 72,
      duration: wood ? 0.11 : 0.14,
      gain,
      type: 'sine',
      attack: 0.004,
      release: 0.09,
      delay,
    });
    noise({
      duration: wood ? 0.065 : 0.1,
      gain: gain * 0.42,
      lowpass: wood ? 1180 : 760,
      highpass: 65,
      attack: 0.003,
      release: 0.06,
      delay,
    });
  }

  function play(name) {
    const cooldown = {
      chop: 80,
      shrimp: 90,
      teaStart: 240,
      teaReady: 160,
      customerIn: 420,
      customerOut: 240,
      cast: 300,
      hook: 260,
      splash: 280,
      ui: 70,
    }[name] ?? 65;
    if (!mayPlay(name, cooldown)) return false;

    switch (name) {
      case 'ui':
        softThump({ gain: 0.035, wood: true });
        break;
      case 'freezer':
        tone({ frequency: 145, endFrequency: 105, duration: 0.14, gain: 0.065, type: 'triangle', release: 0.1 });
        noise({ duration: 0.09, gain: 0.025, lowpass: 760, highpass: 80, release: 0.07, delay: 0.018 });
        break;
      case 'place':
        softThump({ gain: 0.052, wood: true });
        break;
      case 'rice':
        softThump({ gain: 0.055 });
        noise({ duration: 0.12, gain: 0.025, lowpass: 920, highpass: 140, attack: 0.008, release: 0.1, delay: 0.03 });
        break;
      case 'chop':
        noise({ duration: 0.11, gain: 0.068, lowpass: 1550, highpass: 120, attack: 0.002, release: 0.095 });
        tone({ frequency: 128, endFrequency: 84, duration: 0.09, gain: 0.035, type: 'triangle', attack: 0.003, release: 0.07 });
        break;
      case 'shrimp':
        noise({ duration: 0.1, gain: 0.055, lowpass: 1080, highpass: 90, attack: 0.004, release: 0.082 });
        tone({ frequency: 175, endFrequency: 116, duration: 0.1, gain: 0.03, type: 'sine', attack: 0.004, release: 0.075 });
        break;
      case 'sushi':
        softThump({ gain: 0.048, wood: false });
        tone({ frequency: 280, endFrequency: 238, duration: 0.13, gain: 0.026, type: 'sine', attack: 0.012, release: 0.1, delay: 0.035 });
        break;
      case 'teaStart':
        tone({ frequency: 118, endFrequency: 158, duration: 0.22, gain: 0.045, type: 'sine', attack: 0.015, release: 0.15 });
        noise({ duration: 0.28, gain: 0.017, lowpass: 960, highpass: 120, attack: 0.025, release: 0.19, delay: 0.035 });
        break;
      case 'teaReady':
        tone({ frequency: 392, endFrequency: 360, duration: 0.16, gain: 0.036, type: 'sine', attack: 0.008, release: 0.13 });
        tone({ frequency: 590, endFrequency: 530, duration: 0.12, gain: 0.014, type: 'sine', attack: 0.009, release: 0.1, delay: 0.025 });
        break;
      case 'serve':
        softThump({ gain: 0.04, wood: true });
        tone({ frequency: 310, endFrequency: 280, duration: 0.11, gain: 0.02, type: 'sine', attack: 0.008, release: 0.08, delay: 0.02 });
        break;
      case 'cash':
        tone({ frequency: 226, endFrequency: 260, duration: 0.12, gain: 0.036, type: 'triangle', attack: 0.009, release: 0.09 });
        tone({ frequency: 302, endFrequency: 336, duration: 0.13, gain: 0.027, type: 'triangle', attack: 0.009, release: 0.1, delay: 0.055 });
        break;
      case 'purchase':
        softThump({ gain: 0.04, wood: true });
        tone({ frequency: 245, endFrequency: 320, duration: 0.16, gain: 0.035, type: 'sine', attack: 0.012, release: 0.12, delay: 0.045 });
        break;
      case 'trash':
        noise({ duration: 0.17, gain: 0.052, lowpass: 640, highpass: 45, attack: 0.007, release: 0.14 });
        tone({ frequency: 100, endFrequency: 64, duration: 0.13, gain: 0.034, type: 'sine', attack: 0.006, release: 0.11, delay: 0.02 });
        break;
      case 'customerIn':
        tone({ frequency: 246, endFrequency: 284, duration: 0.16, gain: 0.025, type: 'sine', attack: 0.014, release: 0.12 });
        tone({ frequency: 310, endFrequency: 342, duration: 0.13, gain: 0.018, type: 'sine', attack: 0.014, release: 0.1, delay: 0.07 });
        break;
      case 'customerOut':
        softThump({ gain: 0.026, wood: true });
        softThump({ gain: 0.018, wood: true, delay: 0.12 });
        break;
      case 'dayEnd':
        tone({ frequency: 188, endFrequency: 156, duration: 0.25, gain: 0.036, type: 'sine', attack: 0.02, release: 0.2 });
        break;
      case 'dayStart':
        tone({ frequency: 190, endFrequency: 232, duration: 0.22, gain: 0.032, type: 'sine', attack: 0.018, release: 0.18 });
        break;
      case 'cast':
        noise({ duration: 0.2, gain: 0.045, lowpass: 980, highpass: 95, attack: 0.01, release: 0.16 });
        tone({ frequency: 205, endFrequency: 128, duration: 0.16, gain: 0.026, type: 'sine', attack: 0.008, release: 0.13 });
        break;
      case 'hook':
        softThump({ gain: 0.05, wood: true });
        tone({ frequency: 178, endFrequency: 145, duration: 0.12, gain: 0.032, type: 'triangle', attack: 0.004, release: 0.1, delay: 0.025 });
        break;
      case 'reel':
        noise({ duration: 0.14, gain: 0.025, lowpass: 720, highpass: 120, attack: 0.006, release: 0.11 });
        tone({ frequency: 155, endFrequency: 118, duration: 0.12, gain: 0.018, type: 'triangle', attack: 0.005, release: 0.09 });
        break;
      case 'splash':
        noise({ duration: 0.28, gain: 0.075, lowpass: 1050, highpass: 65, attack: 0.008, release: 0.23 });
        tone({ frequency: 118, endFrequency: 70, duration: 0.19, gain: 0.026, type: 'sine', attack: 0.008, release: 0.16, delay: 0.03 });
        break;
      case 'finish':
        tone({ frequency: 220, endFrequency: 252, duration: 0.16, gain: 0.03, type: 'sine', attack: 0.015, release: 0.12 });
        tone({ frequency: 290, endFrequency: 325, duration: 0.18, gain: 0.025, type: 'sine', attack: 0.015, release: 0.14, delay: 0.08 });
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

  // The browser only allows audio after a real interaction. Waking quietly on
  // the first one means delayed events (such as an arriving customer) work
  // naturally afterwards without showing a permission prompt.
  window.addEventListener('pointerdown', wake, { capture: true, passive: true, once: true });
  window.addEventListener('keydown', wake, { capture: true, once: true });
  window.addEventListener('pagehide', stop, { once: true });
})();
