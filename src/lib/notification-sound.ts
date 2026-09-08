const ANSWER_SOUND_SRC = "/assets/sounds/answer-received.wav";
const MUTE_STORAGE_KEY = "partisimulator:sound-muted";

// Lazily created and reused across calls - a fresh Audio() per chime would work too, but debate
// auto mode can trigger this back-to-back, and reuse avoids piling up short-lived audio elements.
let answerSound: HTMLAudioElement | null = null;

function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
}

let muted = readMuted();
const listeners = new Set<() => void>();

/** Plays the chime for a finished party reply; a silent no-op during SSR, while muted, or if the browser blocks playback. */
export function playAnswerSound(): void {
  if (typeof window === "undefined" || muted) return;
  answerSound ??= new Audio(ANSWER_SOUND_SRC);
  answerSound.currentTime = 0;
  // Autoplay can be blocked (e.g. no user gesture yet) - that's fine, the chime is a nice-to-have.
  void answerSound.play().catch(() => {});
}

export function isSoundMuted(): boolean {
  return muted;
}

/** Flips the mute flag, persists it, and notifies every subscribed component (e.g. the nav button). */
export function toggleSoundMuted(): void {
  muted = !muted;
  window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  for (const listener of listeners) listener();
}

export function subscribeSoundMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
