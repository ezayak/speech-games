import type { Lang } from '../main';

// One shared element: iOS only lets an element play after a tap has started it once.
const player = new Audio();
let finish: (() => void) | null = null;

// Family recordings (public/rec) replace generated audio; the value is the save time.
let recorded: Record<string, number> = {};
fetch(`${import.meta.env.BASE_URL}rec/index.json`)
  .then(r => r.json()).then(r => { recorded = r; }).catch(() => {});

export const recordedAt = (key: string) => recorded[key];
export function setRecorded(key: string, time: number | null) {
  if (time) recorded[key] = time;
  else delete recorded[key];
}

export function play(id: string, lang: Lang): Promise<void> {
  finish?.();
  return new Promise(resolve => {
    // Never let a stuck or missing sound hold up the game.
    const guard = setTimeout(() => done(), 10000);
    const done = () => {
      clearTimeout(guard);
      player.onended = player.onerror = null;
      finish = null;
      resolve();
    };
    finish = done;
    player.onended = done;
    player.onerror = done;
    const key = `${lang}/${id}`;
    // ?v= makes the browser fetch a re-recorded file instead of an old copy.
    player.src = recorded[key]
      ? `${import.meta.env.BASE_URL}rec/${key}.mp3?v=${recorded[key]}`
      : `${import.meta.env.BASE_URL}audio/${key}.mp3`;
    player.play().catch(done);
  });
}

export function stop() {
  player.pause();
  finish?.();
}
