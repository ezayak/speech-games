import type { Lang } from '../main';

// One shared element: iOS only lets an element play after a tap has started it once.
const player = new Audio();
let finish: (() => void) | null = null;

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
    player.src = `${import.meta.env.BASE_URL}audio/${lang}/${id}.mp3`;
    player.play().catch(done);
  });
}

export function stop() {
  player.pause();
  finish?.();
}
