type SoundCue = 'hover' | 'click' | 'shutter' | 'chime';
type ChimeVariant = 'thinking' | 'reading' | 'analysing' | 'debugging' | 'copy';

interface AudioEngine {
  context: AudioContext;
  output: GainNode;
}

const SOUND_STORAGE_KEY = 'loom.landing.sound';
export const LANDING_SOUND_EVENT = 'loom:landing-sound';
const HOVER_INTERVAL_MS = 65;
const SHUTTER_DURATION = 0.045;
const CHIME_NOTES: Record<ChimeVariant, readonly [number, number]> = {
  thinking: [523.25, 783.99],
  reading: [493.88, 659.25],
  analysing: [587.33, 880],
  debugging: [440, 554.37],
  copy: [659.25, 987.77],
};

let enabled: boolean | undefined;
let engine: AudioEngine | undefined;
let resuming = false;
let pendingCue: { cue: SoundCue; variant: ChimeVariant | undefined; expiresAt: number } | undefined;
let lastHoverAt = -Infinity;

export function isLandingSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  if (enabled === undefined) {
    try {
      enabled = window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

function unlockAudio(): void {
  if (
    !isLandingSoundEnabled() ||
    window.navigator.userActivation?.isActive === false ||
    typeof window.AudioContext !== 'function' ||
    resuming ||
    engine?.context.state === 'running'
  ) return;

  try {
    if (!engine || engine.context.state === 'closed') {
      const context = new window.AudioContext();
      const output = context.createGain();
      output.connect(context.destination);
      engine = { context, output };
    }

    const resume = engine.context.resume();
    resuming = true;
    void resume.then(() => {
      resuming = false;
      const pending = pendingCue;
      pendingCue = undefined;
      if (pending && window.performance.now() < pending.expiresAt) {
        playLandingSound(pending.cue, pending.variant);
      }
    }).catch(() => {
      resuming = false;
      pendingCue = undefined;
    });
  } catch {
    // Audio may be unavailable even when the browser exposes AudioContext.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (event) => {
    if (event.isTrusted && event.pointerType === 'mouse') unlockAudio();
  }, { capture: true, passive: true });
  window.addEventListener('pointerup', (event) => {
    if (event.isTrusted && event.pointerType !== 'mouse') unlockAudio();
  }, { capture: true, passive: true });
  window.addEventListener('keydown', (event) => {
    if (event.isTrusted && event.key !== 'Escape') unlockAudio();
  }, { capture: true });
}

export function toggleLandingSound(): void {
  if (typeof window === 'undefined') return;
  const next = !isLandingSoundEnabled();
  enabled = next;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, next ? 'on' : 'off');
  } catch {
    // Keep the in-memory preference when storage is unavailable.
  }

  if (engine) engine.output.gain.value = next ? 1 : 0;
  if (next) unlockAudio();
  else pendingCue = undefined;

  window.dispatchEvent(new CustomEvent<boolean>(LANDING_SOUND_EVENT, { detail: next }));
}

function playVoice(
  source: AudioScheduledSourceNode,
  output: GainNode,
  start: number,
  duration: number,
  peak: number,
  filter?: BiquadFilterNode,
): void {
  const envelope = output.context.createGain();
  const end = start + duration;
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(peak, start + 0.002);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  if (filter) {
    source.connect(filter);
    filter.connect(envelope);
  } else {
    source.connect(envelope);
  }
  envelope.connect(output);
  source.onended = () => {
    source.disconnect();
    filter?.disconnect();
    envelope.disconnect();
  };
  source.start(start);
  source.stop(end);
}

function playTone(
  { context, output }: AudioEngine,
  type: OscillatorType,
  start: number,
  duration: number,
  peak: number,
  frequency: number,
  endFrequency?: number,
): void {
  const tone = context.createOscillator();
  tone.type = type;
  tone.frequency.setValueAtTime(frequency, start);
  if (endFrequency !== undefined) {
    tone.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  }
  playVoice(tone, output, start, duration, peak);
}

function playShutter(audio: AudioEngine, start: number): void {
  const { context, output } = audio;
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * SHUTTER_DURATION), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }

  const noise = context.createBufferSource();
  noise.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800;
  filter.Q.value = 0.85;
  playVoice(noise, output, start, SHUTTER_DURATION, 0.032, filter);
  playTone(audio, 'sine', start, SHUTTER_DURATION, 0.028, 180);
}

export function playLandingSound(cue: SoundCue, variant?: ChimeVariant): void {
  if (!engine || !isLandingSoundEnabled()) return;

  if (engine.context.state !== 'running') {
    if (resuming && cue !== 'hover') {
      pendingCue = { cue, variant, expiresAt: window.performance.now() + 150 };
    }
    return;
  }

  const start = engine.context.currentTime;
  switch (cue) {
    case 'hover': {
      const now = window.performance.now();
      if (now - lastHoverAt < HOVER_INTERVAL_MS) return;
      lastHoverAt = now;
      playTone(engine, 'triangle', start, 0.018, 0.025, 920);
      break;
    }
    case 'click':
      playTone(engine, 'triangle', start, 0.03, 0.045, 540, 360);
      break;
    case 'shutter':
      playShutter(engine, start);
      break;
    case 'chime': {
      const [root, harmony] = CHIME_NOTES[variant ?? 'thinking'];
      playTone(engine, 'sine', start, 0.13, 0.03, root);
      playTone(engine, 'sine', start + 0.035, 0.12, 0.025, harmony);
      break;
    }
  }
}
