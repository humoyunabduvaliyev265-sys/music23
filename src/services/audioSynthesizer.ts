/**
 * Web Audio Synthesizer Engine & WAV Audio Exporter
 * Provides musical note synthesis, drum engines, procedural composition,
 * offline rendering to high-fidelity stereo WAV files, and live pad triggering.
 */

// Musical Note to Frequency Map (C2 to B6)
export const NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 2
  C2: 65.41, "C#2": 69.3, D2: 73.42, "D#2": 77.78, E2: 82.41, F2: 87.31,
  "F#2": 92.5, G2: 98.0, "G#2": 103.83, A2: 110.0, "A#2": 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, "C#3": 138.59, D3: 146.83, "D#3": 155.56, E3: 164.81, F3: 174.61,
  "F#3": 185.0, G3: 196.0, "G#3": 207.65, A3: 220.0, "A#3": 233.08, B3: 246.94,
  // Octave 4 (Middle C)
  C4: 261.63, "C#4": 277.18, D4: 293.66, "D#4": 311.13, E4: 329.63, F4: 349.23,
  "F#4": 369.99, G4: 392.0, "G#4": 415.3, A4: 440.0, "A#4": 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, "C#5": 554.37, D5: 587.33, "D#5": 622.25, E5: 659.25, F5: 698.46,
  "F#5": 739.99, G5: 783.99, "G#5": 830.61, A5: 880.0, "A#5": 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.0,
};

export const SCALES = {
  minor: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"],
  major: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "G5"],
  pentatonic: ["A3", "C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5"],
  dorian: ["D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"],
  oriental: ["D4", "D#4", "F#4", "G4", "A4", "A#4", "C5", "D5"], // Phrygian Dominant (Sharqona)
};

// Global Live AudioContext for pad audition and live playback
let liveAudioCtx: AudioContext | null = null;
export function getLiveAudioContext(): AudioContext {
  if (!liveAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    liveAudioCtx = new AudioContextClass();
  }
  if (liveAudioCtx.state === "suspended") {
    liveAudioCtx.resume();
  }
  return liveAudioCtx;
}

/**
 * WAV Encoder: converts Web Audio AudioBuffer to 16-bit PCM stereo WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const dataLength = buffer.length * blockAlign;
  const bufferSize = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");

  // "fmt " sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  // Interleave and write sample data
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Convert to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Trigger live drum/synth pad sounds (interactive beat maker)
 */
export function playLivePadSound(type: string, note?: string) {
  try {
    const ctx = getLiveAudioContext();
    const now = ctx.currentTime;

    if (type === "kick") {
      playKick(ctx, now, ctx.destination);
    } else if (type === "snare") {
      playSnare(ctx, now, ctx.destination);
    } else if (type === "hihat") {
      playHiHat(ctx, now, ctx.destination, false);
    } else if (type === "openhat") {
      playHiHat(ctx, now, ctx.destination, true);
    } else if (type === "clap") {
      playClap(ctx, now, ctx.destination);
    } else if (type === "bass") {
      playBassNote(ctx, now, note || "A2", 0.4, ctx.destination);
    } else if (type === "synth") {
      playLeadNote(ctx, now, note || "E4", 0.4, ctx.destination);
    } else if (type === "bell") {
      playBellNote(ctx, now, note || "A5", 0.8, ctx.destination);
    }
  } catch (e) {
    console.error("Error playing live pad sound:", e);
  }
}

// ----------------- DRUM SYNTHESIS PRIMITIVES -----------------

function playKick(ctx: BaseAudioContext, time: number, destination: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(36, time + 0.12);

  gain.gain.setValueAtTime(1.0, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + 0.36);
}

function playSnare(ctx: BaseAudioContext, time: number, destination: AudioNode) {
  // Tonal body
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, time);
  osc.frequency.exponentialRampToValueAtTime(80, time + 0.1);
  oscGain.gain.setValueAtTime(0.7, time);
  oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
  osc.connect(oscGain);
  oscGain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.16);

  // Noise snap
  const bufferSize = Math.floor(ctx.sampleRate * 0.2);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(800, time);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.8, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  whiteNoise.start(time);
  whiteNoise.stop(time + 0.21);
}

function playHiHat(ctx: BaseAudioContext, time: number, destination: AudioNode, isOpen: boolean) {
  const duration = isOpen ? 0.3 : 0.05;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(8500, time);
  filter.Q.value = 3;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + duration + 0.01);
}

function playClap(ctx: BaseAudioContext, time: number, destination: AudioNode) {
  const duration = 0.25;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1200, time);
  filter.Q.value = 2;

  const gain = ctx.createGain();
  // Multi-burst clap envelope
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.7, time + 0.01);
  gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
  gain.gain.linearRampToValueAtTime(0.7, time + 0.03);
  gain.gain.linearRampToValueAtTime(0.1, time + 0.04);
  gain.gain.linearRampToValueAtTime(0.8, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + duration + 0.01);
}

// ----------------- MELODIC SYNTHESIS PRIMITIVES -----------------

function playBassNote(ctx: BaseAudioContext, time: number, note: string, duration: number, destination: AudioNode) {
  const freq = NOTE_FREQUENCIES[note] || 110;
  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, time);

  subOsc.type = "sine";
  subOsc.frequency.setValueAtTime(freq / 2, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(350, time);
  filter.frequency.exponentialRampToValueAtTime(120, time + duration);

  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(filter);
  subOsc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  osc.start(time);
  subOsc.start(time);
  osc.stop(time + duration + 0.05);
  subOsc.stop(time + duration + 0.05);
}

function playLeadNote(ctx: BaseAudioContext, time: number, note: string, duration: number, destination: AudioNode) {
  const freq = NOTE_FREQUENCIES[note] || 440;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 1.004, time); // slight chorus detune

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, time);
  filter.frequency.exponentialRampToValueAtTime(700, time + duration);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.4, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration + 0.05);
  osc2.stop(time + duration + 0.05);
}

function playBellNote(ctx: BaseAudioContext, time: number, note: string, duration: number, destination: AudioNode) {
  const freq = NOTE_FREQUENCIES[note] || 660;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.35, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(time);
  osc.stop(time + duration + 0.05);
}

function playChordPad(ctx: BaseAudioContext, time: number, chordNotes: string[], duration: number, destination: AudioNode) {
  chordNotes.forEach((note, index) => {
    const freq = NOTE_FREQUENCIES[note] || 220;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = index % 2 === 0 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, time);

    // Warm pad envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.2);
    gain.gain.setValueAtTime(0.12, time + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(time);
    osc.stop(time + duration + 0.1);
  });
}

/**
 * Synthesizes a full procedural track using OfflineAudioContext.
 * Returns an AudioBuffer and a generated standard WAV Blob.
 */
export async function renderCompositionToWav(
  composition: {
    bpm?: number;
    genre?: string;
    scale?: string;
    melodyNotes?: { note: string; step: number; duration?: number }[];
    drumPattern?: {
      kick?: number[];
      snare?: number[];
      hihat?: number[];
      clap?: number[];
    };
    bassPattern?: { note: string; step: number }[];
    chordProgression?: string[];
  },
  totalDurationSeconds: number = 30
): Promise<{ blob: Blob; url: string; duration: number }> {
  const bpm = composition.bpm || 95;
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDurationSeconds), sampleRate);

  // Master compressor / limiter
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, 0);
  compressor.knee.setValueAtTime(30, 0);
  compressor.ratio.setValueAtTime(4, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.25, 0);
  compressor.connect(offlineCtx.destination);

  // Master Gain
  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  // Gentle fade out at the end
  masterGain.gain.setValueAtTime(0.85, totalDurationSeconds - 2.5);
  masterGain.gain.linearRampToValueAtTime(0.001, totalDurationSeconds);
  masterGain.connect(compressor);

  // 16-step bar duration
  const secondsPerBeat = 60 / bpm;
  const stepDuration = secondsPerBeat / 4; // 16th note
  const barDuration = secondsPerBeat * 4; // 4 beats per bar
  const totalBars = Math.ceil(totalDurationSeconds / barDuration);

  // Drum pattern defaults if missing
  const kickSteps = composition.drumPattern?.kick || [0, 8, 10];
  const snareSteps = composition.drumPattern?.snare || [4, 12];
  const hihatSteps = composition.drumPattern?.hihat || [0, 2, 4, 6, 8, 10, 12, 14];
  const clapSteps = composition.drumPattern?.clap || [4, 12];

  // Render loop bars
  for (let bar = 0; bar < totalBars; bar++) {
    const barStartTime = bar * barDuration;
    if (barStartTime >= totalDurationSeconds - 1) break;

    // Intro / Outro arrangement structure
    const isIntro = bar === 0;
    const isBuild = bar === 1;
    const isDrop = bar >= 2 && bar < totalBars - 1;
    const isOutro = bar === totalBars - 1;

    // Schedule Drums
    for (let step = 0; step < 16; step++) {
      const stepTime = barStartTime + step * stepDuration;
      if (stepTime >= totalDurationSeconds - 0.2) break;

      // Kick (plays on build and drop)
      if ((isDrop || isBuild) && kickSteps.includes(step)) {
        playKick(offlineCtx, stepTime, masterGain);
      }

      // Snare (plays on drop)
      if (isDrop && snareSteps.includes(step)) {
        playSnare(offlineCtx, stepTime, masterGain);
      }

      // Hi-Hat (plays across song)
      if (!isIntro && hihatSteps.includes(step)) {
        const isOpen = step % 4 === 2 && Math.random() > 0.6;
        playHiHat(offlineCtx, stepTime, masterGain, isOpen);
      }

      // Clap
      if (isDrop && clapSteps.includes(step)) {
        playClap(offlineCtx, stepTime, masterGain);
      }
    }

    // Schedule Bass
    if (composition.bassPattern && (isDrop || isBuild)) {
      composition.bassPattern.forEach((item) => {
        const bassTime = barStartTime + item.step * stepDuration;
        if (bassTime < totalDurationSeconds - 0.5) {
          playBassNote(offlineCtx, bassTime, item.note, stepDuration * 2.5, masterGain);
        }
      });
    }

    // Schedule Melodies
    if (composition.melodyNotes && composition.melodyNotes.length > 0) {
      composition.melodyNotes.forEach((item) => {
        const noteTime = barStartTime + item.step * stepDuration;
        if (noteTime < totalDurationSeconds - 0.5) {
          const noteDuration = (item.duration || 1) * stepDuration * 1.5;
          // Alter instrument flavor based on genre
          if (composition.genre === "ambient" || composition.genre === "lofi") {
            playBellNote(offlineCtx, noteTime, item.note, noteDuration * 1.2, masterGain);
          } else {
            playLeadNote(offlineCtx, noteTime, item.note, noteDuration, masterGain);
          }
        }
      });
    }

    // Schedule Chord Pads
    const chordProgressions: Record<string, string[][]> = {
      minor: [["A3", "C4", "E4"], ["F3", "A3", "C4"], ["C3", "E3", "G3"], ["G3", "B3", "D4"]],
      major: [["C3", "E3", "G3"], ["G3", "B3", "D4"], ["A3", "C4", "E4"], ["F3", "A3", "C4"]],
      oriental: [["D3", "F#3", "A3"], ["D#3", "G3", "A#3"], ["C3", "E3", "G3"], ["D3", "F#3", "A3"]],
    };
    const chordList = chordProgressions[composition.scale || "minor"] || chordProgressions.minor;
    const currentChord = chordList[bar % chordList.length];
    playChordPad(offlineCtx, barStartTime, currentChord, barDuration, masterGain);
  }

  // Render audio buffer
  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  const url = URL.createObjectURL(wavBlob);

  return {
    blob: wavBlob,
    url,
    duration: totalDurationSeconds,
  };
}

/**
 * Downloads an audio track to the user's phone or computer device
 */
export function downloadAudioTrack(track: { title: string; audioBlob?: Blob; audioUrl: string }) {
  try {
    const link = document.createElement("a");
    const safeTitle = (track.title || "musiqa")
      .replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, "_")
      .slice(0, 40);
    const filename = `${safeTitle}.wav`;

    if (track.audioBlob) {
      const blobUrl = URL.createObjectURL(track.audioBlob);
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } else {
      link.href = track.audioUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (e) {
    console.error("Error downloading track:", e);
    // Fallback opening
    window.open(track.audioUrl, "_blank");
  }
}
