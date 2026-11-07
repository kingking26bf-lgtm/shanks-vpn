/**
 * SHANKS VPN - Discreet Audio Synthesizer (Web Audio API)
 * Generates lightweight, pleasant Android-style chimes for VPN events.
 * Requires no external audio files, operates offline and on mobile WebViews.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Discreet ascending two-tone chime when VPN connects successfully
   */
  playConnectSuccess(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: E6 (1318.5 Hz) soft chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.2);

      gain2.gain.setValueAtTime(0.06, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } catch {
      // Audio playback silently ignored if blocked by autoplay policies
    }
  }

  /**
   * Subtle descending low tone when VPN connection fails or disconnects
   */
  playConnectFailure(enabled: boolean = true) {
    if (!enabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(349.23, now); // F4
      osc.frequency.exponentialRampToValueAtTime(220.00, now + 0.25); // A3

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }
}

export const soundEffects = new SoundService();

export function playConnectSuccess(enabled: boolean = true) {
  soundEffects.playConnectSuccess(enabled);
}

export function playConnectFailure(enabled: boolean = true) {
  soundEffects.playConnectFailure(enabled);
}

