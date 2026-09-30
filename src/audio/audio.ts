/**
 * Tiny WebAudio sound manager. Muted by default; the AudioContext is only
 * created after the user turns sound on (a user gesture), per autoplay rules.
 *
 * Until real recordings are supplied, sounds are synthesised:
 *   rustle — filtered noise burst (leaves)
 *   creak  — low, pitch-bending resonant tone (wood)
 * To use files instead, put e.g. /public/audio/creak.mp3 and set FILES below.
 */
const FILES: Partial<Record<SoundName, string>> = {
  // creak: '/audio/creak.mp3',
  // rustle: '/audio/rustle.mp3',
};

export type SoundName = 'rustle' | 'creak';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
const buffers = new Map<SoundName, AudioBuffer>();
let lastPlay = 0;

function ensureContext() {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  for (const [name, url] of Object.entries(FILES) as [SoundName, string][]) {
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((b) => ctx!.decodeAudioData(b))
      .then((buf) => buffers.set(name, buf))
      .catch(() => {});
  }
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (on) {
    const c = ensureContext();
    void c?.resume();
  } else {
    void ctx?.suspend();
  }
}

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function synthRustle(c: AudioContext, out: AudioNode, intensity: number) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 1.4);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600 + Math.random() * 1200;
  bp.Q.value = 0.7;
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.18 * intensity, t + 0.12);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
  src.stop(t + 1.4);
}

function synthCreak(c: AudioContext, out: AudioNode, intensity: number) {
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  const f0 = 70 + Math.random() * 30;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.linearRampToValueAtTime(f0 * 0.7, t + 0.9);
  // irregular "ratchet" of wood fibres
  const lfo = c.createOscillator();
  lfo.frequency.value = 18 + Math.random() * 10;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.5;
  const amp = c.createGain();
  amp.gain.value = 0.5;
  lfo.connect(lfoGain).connect(amp.gain);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 420;
  bp.Q.value = 4;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12 * intensity, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  osc.connect(amp).connect(bp).connect(g).connect(out);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 1.05);
  lfo.stop(t + 1.05);
}

/** Play a sound if enabled. Rate-limited so rapid clicks don't stack into noise. */
export function playSound(name: SoundName, intensity = 1) {
  if (!enabled || !ctx || !master) return;
  const now = performance.now();
  if (now - lastPlay < 120) return;
  lastPlay = now;
  const buf = buffers.get(name);
  if (buf) {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = intensity;
    src.connect(g).connect(master);
    src.start();
    return;
  }
  if (name === 'rustle') synthRustle(ctx, master, intensity);
  else synthCreak(ctx, master, intensity);
}
