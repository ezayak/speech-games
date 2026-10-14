import { el } from './dom';

export const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// Game screen: top bar (← back, mode buttons, level dots, 🔊), progress bar, optional extra row, stage.
export function gameScreen<M extends string>(app: HTMLElement, icons: Record<M, string>, extra?: HTMLElement) {
  const back = el('button', 'back', '←');
  const modes = el('div', 'modes');
  const modeBtns = {} as Record<M, HTMLButtonElement>;
  for (const [m, icon] of Object.entries(icons) as [M, string][]) {
    modeBtns[m] = el('button', '', icon);
    modes.append(modeBtns[m]);
  }
  const badge = el('span', 'badge');
  const replay = el('button', 'replay', '🔊');
  const bar = el('header', 'game-bar');
  bar.append(back, modes, el('span', 'spacer'), badge, replay);
  const progress = el('div', 'progress');
  const fill = el('i');
  progress.append(fill);
  const stage = el('main', 'stage');
  app.replaceChildren(bar, progress, ...(extra ? [extra] : []), stage);

  return {
    back, replay, modeBtns, stage,
    showMode(m: M) {
      for (const [k, b] of Object.entries(modeBtns) as [M, HTMLButtonElement][]) b.classList.toggle('on', k === m);
    },
    // null hides the dots (Learn and Say it have no levels).
    showLevel(v: number | null) { badge.textContent = v ? '●'.repeat(v) + '○'.repeat(3 - v) : ''; },
    showProgress(f: number) { fill.style.width = `${f * 100}%`; },
  };
}

// End of a session: one ⭐ per round right first time (always at least one), then ↻ or ←.
export function endScreen(stage: HTMLElement, stars: number, onAgain: () => void, onHome: () => void) {
  const again = el('button', 'big', '↻');
  again.onclick = onAgain;
  const home = el('button', 'big', '←');
  home.onclick = onHome;
  const row = el('div', 'row');
  row.append(again, home);
  const end = el('div', 'end');
  end.append(el('div', 'stars', '⭐'.repeat(Math.max(stars, 1))), row);
  stage.replaceChildren(end);
}
