import type { Lang } from '../main';
import { pick, shuffle, sentences } from '../core/content';
import { play, stop } from '../core/audio';
import { levelFor } from '../core/level';
import { el } from '../ui/dom';

type Mode = 'learn' | 'listen';
type Group = 'all' | 'action' | 'thing' | 'feel' | 'social';

const GROUPS: { id: Group; icon: string }[] = [
  { id: 'all', icon: '⭐' }, { id: 'action', icon: '🍽️' }, { id: 'thing', icon: '💧' },
  { id: 'feel', icon: '😋' }, { id: 'social', icon: '🙋' },
];
const CHOICES = [2, 3, 4];
const ROUNDS = 10;
const RTL: Lang[] = ['arz', 'ar'];

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

export function startWant(app: HTMLElement, lang: Lang, onExit: () => void) {
  const level = levelFor('want', lang);
  let mode: Mode = 'learn';
  let group: Group = 'all';
  let round = 0, stars = 0;
  // Bumped on every new screen so a round that is still finishing doesn't continue.
  let token = 0;
  let say = () => Promise.resolve();

  const back = el('button', 'back', '←');
  const modes = el('div', 'modes');
  const modeBtns: Record<Mode, HTMLButtonElement> = { learn: el('button', '', '📖'), listen: el('button', '', '👂') };
  for (const [m, b] of Object.entries(modeBtns)) {
    b.onclick = () => setMode(m as Mode);
    modes.append(b);
  }
  const badge = el('span', 'badge');
  const replay = el('button', 'replay', '🔊');
  const bar = el('header', 'game-bar');
  bar.append(back, modes, el('span', 'spacer'), badge, replay);
  const progress = el('div', 'progress');
  const fill = el('i');
  progress.append(fill);
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
  const stage = el('main', 'stage');
  app.replaceChildren(bar, progress, groups, stage);

  const exit = () => { token++; stop(); onExit(); };
  back.onclick = exit;
  replay.onclick = () => say();
  const setMode = (m: Mode) => {
    mode = m;
    for (const [k, b] of Object.entries(modeBtns)) b.classList.toggle('on', k === m);
    restart();
  };

  const pool = () => group === 'all' ? sentences : sentences.filter(s => s.group === group);

  function restart() { round = 0; stars = 0; next(); }

  function next() {
    token++;
    if (mode === 'learn') return learnScreen(0);
    badge.textContent = '●'.repeat(level.value) + '○'.repeat(3 - level.value);
    fill.style.width = `${(round / ROUNDS) * 100}%`;
    if (round >= ROUNDS) showEnd();
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
    badge.textContent = '';
    fill.style.width = `${((i + 1) / list.length) * 100}%`;
    say = () => play(id, lang);

    const pic = el('button', 'phrase-pic', s.pic);
    pic.onclick = () => say();
    const words = el('div', 'phrase-words');
    words.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
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

  function showEnd() {
    say = () => play('ui.great', lang);
    const again = el('button', 'big', '↻');
    again.onclick = restart;
    const home = el('button', 'big', '←');
    home.onclick = exit;
    const row = el('div', 'row');
    row.append(again, home);
    const end = el('div', 'end');
    end.append(el('div', 'stars', '⭐'.repeat(Math.max(stars, 1))), row);
    stage.replaceChildren(end);
    say();
  }

  setMode('learn');
}
