/** SFX arcade mínimos generados con WebAudio (sin archivos de audio). */

type Sfx = "move" | "capture" | "win" | "lose" | "buy" | "select";

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean): void {
  enabled = v;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function blip(freq: number, durationMs: number, type: OscillatorType, when = 0, gain = 0.08): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + durationMs / 1000);
}

export function playSfx(name: Sfx): void {
  if (!enabled) return;
  switch (name) {
    case "select":
      blip(520, 60, "square", 0, 0.05);
      break;
    case "move":
      blip(330, 80, "triangle");
      blip(440, 70, "triangle", 0.04);
      break;
    case "capture":
      blip(220, 90, "sawtooth", 0, 0.09);
      blip(160, 130, "square", 0.06, 0.07);
      break;
    case "buy":
      blip(660, 70, "square");
      blip(880, 90, "square", 0.07);
      blip(1175, 120, "square", 0.15);
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) => blip(f, 160, "triangle", i * 0.1, 0.09));
      break;
    case "lose":
      [392, 330, 262, 196].forEach((f, i) => blip(f, 200, "sawtooth", i * 0.12, 0.07));
      break;
  }
}
