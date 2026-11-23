// Subtle, low-volume Web Audio API sound engine (zero external audio dependencies)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playSubtleClick(enabled: boolean, volume = 0.25): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

    const peak = Math.min(0.06, Math.max(0.005, volume * 0.06));
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Ignore audio context errors in restricted environments
  }
}

export function playCompletionChime(enabled: boolean, volume = 0.25): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const peak = Math.min(0.08, Math.max(0.01, volume * 0.08));
    const notes = [587.33, 880]; // D5 -> A5 soft fifth

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // Ignore audio context errors
  }
}

export function playReminderTone(enabled: boolean, volume = 0.25): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const peak = Math.min(0.09, Math.max(0.01, volume * 0.09));
    const notes = [659.25, 783.99, 987.77]; // E5 -> G5 -> B5 gentle triad

    notes.forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.38);
    });
  } catch {
    // Ignore audio context errors
  }
}
