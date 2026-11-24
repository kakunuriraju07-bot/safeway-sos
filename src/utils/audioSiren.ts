let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let isPlaying = false;
let sirenInterval: any = null;

export const startSiren = () => {
  if (isPlaying) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 650;
    gainNode.gain.value = 0.35;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    isPlaying = true;

    let high = false;
    sirenInterval = setInterval(() => {
      if (!oscillator || !audioCtx) return;
      const freq = high ? 950 : 600;
      oscillator.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
      high = !high;
    }, 400);
  } catch (e) {
    console.error('Audio siren error:', e);
  }
};

export const stopSiren = () => {
  if (sirenInterval) clearInterval(sirenInterval);
  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch {}
    oscillator = null;
  }
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch {}
    gainNode = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch {}
    audioCtx = null;
  }
  isPlaying = false;
};

export const isSirenPlaying = () => isPlaying;
