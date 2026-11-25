// Tiny synthesised sound effects (WebAudio, no audio files): a chop thunk, a
// sizzle, a serve ding, a fail buzz. The context is created on the first user
// gesture, so staged screenshots stay silent.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol = 0.08, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t0);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    play(name) {
      if (muted) return;
      if (name === 'pickup') tone(520, 0.08, 'triangle', 0.08);
      else if (name === 'place') tone(340, 0.09, 'triangle', 0.09);
      else if (name === 'chop') {
        noise(0.06, 0.16);
        tone(160, 0.07, 'square', 0.07);
      } else if (name === 'chopped') {
        tone(660, 0.1, 'triangle', 0.1);
        tone(880, 0.12, 'triangle', 0.09, 0.08);
      } else if (name === 'serve') {
        tone(523, 0.12, 'triangle', 0.12);
        tone(659, 0.12, 'triangle', 0.12, 0.09);
        tone(784, 0.2, 'triangle', 0.12, 0.18);
      } else if (name === 'deny') tone(140, 0.15, 'square', 0.07);
      else if (name === 'trash') noise(0.12, 0.1);
      else if (name === 'miss') {
        tone(220, 0.25, 'sawtooth', 0.08);
        tone(165, 0.35, 'sawtooth', 0.08, 0.15);
      } else if (name === 'ding') tone(1046, 0.25, 'sine', 0.1);
      else if (name === 'sizzle') noise(0.4, 0.05);
    },
  };
}
