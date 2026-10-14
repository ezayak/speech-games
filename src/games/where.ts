import type { Lang } from '../main';
import { byTag, pick, shuffle, text, type Word } from '../core/content';
import { play, stop } from '../core/audio';
import { levelFor } from '../core/level';
import { makeDraggable } from '../core/drag';
import { buildScene, type Pos } from '../ui/scene';
import { el } from '../ui/dom';
import { dirOf } from '../core/langs';
import { gameScreen, endScreen, wait } from '../ui/shell';

type Mode = 'learn' | 'understand' | 'do';

const LEARN_ORDER: Pos[] = ['on', 'under', 'in', 'behind', 'front', 'next'];

// Positions used at each level; level 1 keeps only the most different ones.
const POOLS: Pos[][] = [
  ['on', 'under', 'in'],
  ['on', 'under', 'in', 'behind', 'front'],
  ['on', 'under', 'in', 'behind', 'front', 'next'],
];
const CHOICES = [2, 3, 4];
const ROUNDS = 10;
// Drops further than this from every place (scene units) just go back to the tray.
const MAX_DROP = 130;

const allowed = (ref: Word, pool: Pos[]) => (ref.pos as Pos[]).filter(p => pool.includes(p));

export function startWhere(app: HTMLElement, lang: Lang, onExit: () => void) {
  const level = levelFor('where', lang);
  let mode: Mode = 'learn';
  let round = 0, stars = 0;
  // Bumped on every new screen so a round that is still finishing doesn't continue.
  let token = 0;
  let say = () => Promise.resolve();

  const ui = gameScreen<Mode>(app, { learn: '📖', understand: '👆', do: '✋' });
  const stage = ui.stage;
  for (const [m, b] of Object.entries(ui.modeBtns)) b.onclick = () => setMode(m as Mode);

  const exit = () => { token++; stop(); onExit(); };
  ui.back.onclick = exit;
  ui.replay.onclick = () => say();
  const setMode = (m: Mode) => {
    mode = m;
    ui.showMode(m);
    restart();
  };

  function restart() { round = 0; stars = 0; next(); }

  function next() {
    token++;
    if (mode === 'learn') return learnScreen(0);
    ui.showLevel(level.value);
    ui.showProgress(round / ROUNDS);
    if (round >= ROUNDS) showEnd();
    else if (mode === 'understand') understandRound();
    else doRound();
  }

  async function finishRound(firstTry: boolean) {
    const t = token;
    if (firstTry) stars++;
    level.record(firstTry);
    await play('ui.great', lang);
    await wait(400);
    if (t !== token) return;
    round++;
    next();
  }

  function setup(n: number, all = false) {
    const pool = POOLS[level.value - 1];
    const obj = pick(byTag('where-obj'), 1)[0];
    const ref = pick(byTag('where-ref').filter(r => allowed(r, pool).length >= n), 1)[0];
    const opts = allowed(ref, pool);
    const places = all ? shuffle(opts) : pick(opts, n);
    return { obj, ref, places, target: places[0] };
  }

  function understandRound() {
    const { obj, ref, places, target } = setup(CHOICES[level.value - 1]);
    const id = `where.at.${obj.id}.${target}.${ref.id}`;
    say = () => play(id, lang);
    let firstTry = true;
    const grid = el('div', `choices n${places.length}`);
    for (const p of shuffle(places)) {
      const card = el('button', 'choice');
      const s = buildScene(obj, ref);
      s.place(p);
      card.append(s.svg);
      card.onclick = async () => {
        if (p === target) {
          card.classList.add('right');
          grid.classList.add('done');
          finishRound(firstTry);
          return;
        }
        firstTry = false;
        card.classList.add('faded');
        card.disabled = true;
        await play('ui.again', lang);
        say();
      };
      grid.append(card);
    }
    stage.replaceChildren(grid);
    say();
  }

  function doRound() {
    const L = level.value;
    const { obj, ref, places, target } = setup(L === 3 ? 3 : CHOICES[L - 1], L === 3);
    const id = `where.put.${obj.id}.${target}.${ref.id}`;
    say = () => play(id, lang);
    let firstTry = true, busy = false;
    let open = [...places];
    const scene = buildScene(obj, ref);
    const item = el('div', 'item', obj.pic);
    const tray = el('div', 'tray');
    tray.append(item);

    makeDraggable(item, scene.svg, async (x, y) => {
      if (busy) return;
      const hit = scene.nearest(x, y, open);
      if (hit.dist > MAX_DROP) return;
      scene.place(hit.pos);
      item.classList.add('gone');
      if (hit.pos === target) return finishRound(firstTry);
      // Wrong place: show it briefly, then remove that option and try again.
      busy = true;
      firstTry = false;
      open = open.filter(p => p !== hit.pos);
      await wait(900);
      scene.place(null);
      item.classList.remove('gone');
      await play('ui.again', lang);
      busy = false;
      say();
    });

    stage.replaceChildren(scene.svg, tray);
    say();
  }

  // Learn: word, example picture and sentence; tap any of them to hear it again.
  function learnScreen(i: number) {
    const t = ++token;
    const pos = LEARN_ORDER[i];
    ui.showLevel(null);
    ui.showProgress((i + 1) / LEARN_ORDER.length);
    const ref = pick(byTag('where-ref').filter(r => r.pos!.includes(pos)), 1)[0];
    const obj = pick(byTag('where-obj'), 1)[0];
    const sentenceId = `where.at.${obj.id}.${pos}.${ref.id}`;
    const sayWord = () => play(`pos.${pos}`, lang);
    const saySentence = () => play(sentenceId, lang);
    say = async () => {
      await sayWord();
      await wait(500);
      if (t === token) await saySentence();
    };

    const card = el('div', 'learn');
    card.dir = dirOf(lang);
    const word = el('button', 'learn-word', text(`pos.${pos}`, lang));
    word.onclick = () => sayWord();
    const s = buildScene(obj, ref);
    s.place(pos);
    s.svg.onclick = () => saySentence();
    const sentence = el('button', 'learn-sentence', text(sentenceId, lang));
    sentence.onclick = () => saySentence();
    // Arrows keep left = back even in Arabic, to match the ← button.
    const nav = el('div', 'learn-nav');
    nav.dir = 'ltr';
    const prev = el('button', 'big', '◀'), again = el('button', 'big', '🔄'), fwd = el('button', 'big', '▶');
    prev.disabled = i === 0;
    fwd.disabled = i === LEARN_ORDER.length - 1;
    prev.onclick = () => learnScreen(i - 1);
    again.onclick = () => learnScreen(i);
    fwd.onclick = () => learnScreen(i + 1);
    nav.append(prev, again, fwd);
    card.append(word, s.svg, sentence, nav);
    stage.replaceChildren(card);
    say();
  }

  function showEnd() {
    say = () => play('ui.great', lang);
    endScreen(stage, stars, restart, exit);
    say();
  }

  setMode('learn');
}
