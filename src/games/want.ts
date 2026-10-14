import type { Lang } from '../main';
import { pick, shuffle, sentences, type Sentence } from '../core/content';
import { play, stop } from '../core/audio';
import { levelFor } from '../core/level';
import { makeDraggable } from '../core/drag';
import { el } from '../ui/dom';
import { dirOf } from '../core/langs';
import { gameScreen, endScreen, wait } from '../ui/shell';

type Mode = 'learn' | 'listen' | 'say' | 'build';
type Group = 'all' | 'action' | 'thing' | 'feel' | 'social';

const GROUPS: { id: Group; icon: string }[] = [
  { id: 'all', icon: '⭐' }, { id: 'action', icon: '🍽️' }, { id: 'thing', icon: '💧' },
  { id: 'feel', icon: '😋' }, { id: 'social', icon: '🙋' },
];
const CHOICES = [2, 3, 4];
const ROUNDS = 10;


export function startWant(app: HTMLElement, lang: Lang, onExit: () => void) {
  const level = levelFor('want', lang);
  const buildLevel = levelFor('want-build', lang);
  const lvl = () => (mode === 'build' ? buildLevel : level);
  let mode: Mode = 'learn';
  let group: Group = 'all';
  let round = 0, stars = 0;
  // Bumped on every new screen so a round that is still finishing doesn't continue.
  let token = 0;
  let say = () => Promise.resolve();

  const groups = el('div', 'groups');
  for (const g of GROUPS) {
    const b = el('button', g.id === group ? 'on' : '', g.icon);
    b.onclick = () => {
      group = g.id;
      groups.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      restart();
    };
    groups.append(b);
  }
  const ui = gameScreen<Mode>(app, { learn: '📖', listen: '👂', say: '🗣', build: '🧩' }, groups);
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

  const pool = () => group === 'all' ? sentences : sentences.filter(s => s.group === group);

  let order: Sentence[] = [];
  function restart() {
    round = 0;
    stars = 0;
    // One-word phrases ("Stop") can't be built.
    order = shuffle(mode === 'build' ? pool().filter(s => s.tokens[lang].length > 1) : pool());
    next();
  }

  function next() {
    token++;
    if (mode === 'learn') return learnScreen(0);
    ui.showLevel(mode === 'say' ? null : lvl().value);
    ui.showProgress(round / ROUNDS);
    if (round >= ROUNDS) showEnd();
    else if (mode === 'say') sayRound();
    else if (mode === 'build') buildRound();
    else listenRound();
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

  // Learn: picture + phrase as word cards; the picture says the phrase, each card says its word.
  function learnScreen(i: number) {
    token++;
    const list = pool();
    const s = list[i];
    const id = `say.${s.id}`;
    ui.showLevel(null);
    ui.showProgress((i + 1) / list.length);
    say = () => play(id, lang);

    const pic = el('button', 'phrase-pic', s.pic);
    pic.onclick = () => say();
    const words = el('div', 'phrase-words');
    words.dir = dirOf(lang);
    s.tokens[lang].forEach((w, k) => {
      const b = el('button', 'word', w);
      b.onclick = () => play(`${id}.${k}`, lang);
      words.append(b);
    });
    // Arrows keep left = back even in Arabic, to match the ← button.
    const nav = el('div', 'learn-nav');
    nav.dir = 'ltr';
    const prev = el('button', 'big', '◀'), fwd = el('button', 'big', '▶');
    prev.disabled = i === 0;
    fwd.disabled = i === list.length - 1;
    prev.onclick = () => learnScreen(i - 1);
    fwd.onclick = () => learnScreen(i + 1);
    nav.append(prev, fwd);
    const card = el('div', 'phrase-learn');
    card.append(pic, words, nav);
    stage.replaceChildren(card);
    say();
  }

  function listenRound() {
    const options = pick(pool(), CHOICES[level.value - 1]);
    const target = options[0];
    const id = `say.${target.id}`;
    say = () => play(id, lang);
    let firstTry = true;
    const grid = el('div', `choices n${options.length}`);
    for (const s of shuffle(options)) {
      const card = el('button', 'choice pic-choice', s.pic);
      card.onclick = async () => {
        if (s === target) {
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

  // Say it: Alex names the picture; each ⋯ box shows and says its word; the parent judges.
  function sayRound() {
    const t = token;
    const s = order[round % order.length];
    const id = `say.${s.id}`;
    const tokens = s.tokens[lang];
    const open = new Set<number>();
    say = () => Promise.resolve();

    const words = el('div', 'phrase-words');
    words.dir = dirOf(lang);
    const show = (k: number) => {
      open.add(k);
      cards[k].textContent = tokens[k];
      cards[k].classList.remove('hidden');
      // 🔊 replays the open words in sentence order, or the whole phrase once all are open.
      const ks = [...open].sort((a, b) => a - b);
      say = open.size === tokens.length
        ? () => play(id, lang)
        : async () => {
          for (const j of ks) if (t === token) await play(`${id}.${j}`, lang);
        };
    };
    // Touching a box shows its word and says it.
    const cards = tokens.map((_, k) => {
      const c = el('button', 'word hidden', '⋯');
      c.onclick = () => {
        show(k);
        play(`${id}.${k}`, lang);
      };
      words.append(c);
      return c;
    });

    const advance = async () => {
      await wait(400);
      if (t !== token) return;
      round++;
      next();
    };
    const good = el('button', '', '😀'), almost = el('button', '', '🙂'), skip = el('button', '', '➡');
    const lock = () => { good.disabled = almost.disabled = skip.disabled = true; };
    good.onclick = async () => {
      lock();
      if (open.size === 0) stars++;
      await play('ui.great', lang);
      await play(id, lang);
      advance();
    };
    almost.onclick = async () => {
      lock();
      tokens.forEach((_, k) => show(k));
      await play(id, lang);
      advance();
    };
    skip.onclick = () => { lock(); advance(); };
    const parent = el('div', 'parent-row');
    parent.append(good, almost, skip);

    const card = el('div', 'phrase-learn');
    card.append(el('div', 'phrase-pic', s.pic), words, parent);
    stage.replaceChildren(card);
  }

  // Build: put the word cards in order; touching a card says it; a wrong card makes the right one pulse.
  function buildRound() {
    const t = token;
    const s = order[round % order.length];
    const id = `say.${s.id}`;
    const tokens = s.tokens[lang];
    const L = buildLevel.value;
    const fixed = L === 1 ? Math.max(0, tokens.length - 2) : 0;
    let nextSlot = fixed;
    let firstTry = true;
    say = () => play(id, lang);

    const dir = dirOf(lang);
    const slots = el('div', 'phrase-words slots');
    slots.dir = dir;
    const slotEls = tokens.map((w, k) => {
      const c = el('div', k < fixed ? 'slot filled' : 'slot', k < fixed ? w : '');
      slots.append(c);
      return c;
    });

    const cards = tokens.slice(fixed).map((w, k) => ({ w, audio: `${id}.${k + fixed}` }));
    // Level 3 adds one word from another phrase that isn't in this one.
    if (L === 3) {
      cards.push(...pick(sentences.flatMap(x => x.tokens[lang].map((w, j) => ({ w, audio: `say.${x.id}.${j}` })))
        .filter(c => !tokens.includes(c.w)), 1));
    }
    const tray = el('div', 'tray build-tray');
    tray.dir = dir;
    const onSlots = (x: number, y: number) => {
      const r = slots.getBoundingClientRect();
      return x > r.left - 40 && x < r.right + 40 && y > r.top - 60 && y < r.bottom + 60;
    };
    const els: HTMLElement[] = [];
    for (const c of shuffle(cards)) {
      const card = el('div', 'item word-card', c.w);
      card.addEventListener('pointerdown', () => play(c.audio, lang));
      makeDraggable(card, slots, (x, y) => {
        if (!onSlots(x, y) || nextSlot >= tokens.length) return;
        if (c.w === tokens[nextSlot]) {
          slotEls[nextSlot].textContent = c.w;
          slotEls[nextSlot].classList.add('filled');
          card.remove();
          if (++nextSlot === tokens.length) complete();
          return;
        }
        firstTry = false;
        const right = els.find(e => e.isConnected && e.textContent === tokens[nextSlot]);
        right?.classList.remove('pulse');
        void right?.offsetWidth;
        right?.classList.add('pulse');
        play(`${id}.${nextSlot}`, lang);
      });
      els.push(card);
      tray.append(card);
    }

    async function complete() {
      if (firstTry) stars++;
      buildLevel.record(firstTry);
      await play(id, lang);
      await play('ui.great', lang);
      await wait(400);
      if (t !== token) return;
      round++;
      next();
    }

    const card = el('div', 'phrase-learn build');
    card.append(el('div', 'phrase-pic', s.pic), slots, tray);
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
