let audioCtx = null;
let isSfxMuted = false;

export function toggleSfxMuted() {
  isSfxMuted = !isSfxMuted;
  localStorage.setItem("sfxMuted", JSON.stringify(isSfxMuted));
  return isSfxMuted;
}

export function getSfxMuted() {
  return isSfxMuted;
}

export function getSharedAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate white noise buffer
let noiseBuffer = null;
function getNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  if (!audioCtx) getSharedAudioCtx();
  const bufferSize = audioCtx.sampleRate * 2; // 2 seconds of noise
  noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function playNoise(volume = 0.5, duration = 0.1, bandpassFreq = null, lowpassFreq = null) {
  if (isSfxMuted) return;
  getSharedAudioCtx();
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer();
  
  let lastNode = noiseSource;

  if (bandpassFreq) {
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = bandpassFreq;
    bandpass.Q.value = 1;
    lastNode.connect(bandpass);
    lastNode = bandpass;
  }

  if (lowpassFreq) {
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = lowpassFreq;
    lastNode.connect(lowpass);
    lastNode = lowpass;
  }

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  lastNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  noiseSource.start();
  noiseSource.stop(audioCtx.currentTime + duration);
}

function playOscillator(type = 'sine', freq = 440, volume = 0.5, duration = 0.1) {
  if (isSfxMuted) return;
  getSharedAudioCtx();
  const osc = audioCtx.createOscillator();
  osc.type = type;
  
  // Pitch drop envelope for percussive hit
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + duration);

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playWaterSlosh(volume = 0.05) {
  if (isSfxMuted) return;
  getSharedAudioCtx();
  
  // 1. The "Splash" (Noise)
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = getNoiseBuffer();
  
  const bandpass = audioCtx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 600;
  bandpass.Q.value = 0.5;
  
  const lowpass = audioCtx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(2000, audioCtx.currentTime);
  lowpass.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0, audioCtx.currentTime);
  noiseGain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

  noiseSource.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  
  noiseSource.start();
  noiseSource.stop(audioCtx.currentTime + 0.3);

  // 2. The "Bloop" (Oscillator)
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);

  const oscGain = audioCtx.createGain();
  oscGain.gain.setValueAtTime(0, audioCtx.currentTime);
  oscGain.gain.linearRampToValueAtTime(volume * 1.5, audioCtx.currentTime + 0.02);
  oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

  osc.connect(oscGain);
  oscGain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

export function playGrassStep(volume = 0.004) {
  playNoise(volume, 0.08, 4000, 6000);
}

export function playDirtStep(volume = 0.006) {
  playNoise(volume, 0.06, 1500, 2500);
}

export function playWoodStep(volume = 0.015) {
  playOscillator('triangle', 120, volume, 0.1);
}

export function playTileStep(volume = 0.01) {
  playOscillator('square', 250, volume, 0.05);
}
