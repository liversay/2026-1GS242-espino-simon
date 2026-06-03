/** SFX arcade mínimos generados con WebAudio (sin archivos de audio). */

type Sfx =
  | "move"
  | "capture"
  | "win"
  | "lose"
  | "buy"
  | "select"
  | "hover"
  | "back"
  | "reward";

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean): void {
  enabled = v;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  // Requisito de autoplay: reanudar el contexto en una interacción del usuario.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Desbloquea el AudioContext en la primera interacción (gesto del usuario). */
export function unlockAudio(): void {
  audio();
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
    case "hover":
      blip(1320, 28, "square", 0, 0.03);
      break;
    case "select":
      blip(660, 55, "square", 0, 0.05);
      blip(990, 70, "square", 0.05, 0.045);
      break;
    case "back":
      blip(260, 110, "triangle", 0, 0.05);
      blip(180, 130, "sine", 0.05, 0.04);
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
    case "reward":
      [660, 880, 1175, 1568].forEach((f, i) => blip(f, 110, "square", i * 0.07, 0.06));
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) => blip(f, 160, "triangle", i * 0.1, 0.09));
      break;
    case "lose":
      [392, 330, 262, 196].forEach((f, i) => blip(f, 200, "sawtooth", i * 0.12, 0.07));
      break;
  }
}
