import './style.css';
import { el } from './ui/dom';
import { startWhere } from './games/where';
import { startWant } from './games/want';
import { startRecorder } from './parent/recorder';

export type Lang = 'en' | 'uk' | 'arz' | 'ar';

interface Game { id: string; icon: string; name: string; ready: boolean }
interface Category { id: string; icon: string; name: string; games: Game[] }

const LANGS: { id: Lang; label: string }[] = [
  { id: 'en', label: 'EN' },
  { id: 'uk', label: 'УКР' },
  { id: 'arz', label: 'مصري' },
  { id: 'ar', label: 'فصحى' },
];

const CATEGORIES: Category[] = [
  { id: 'listening', icon: '👂', name: 'Listening', games: [
    { id: 'listen-tap', icon: '👆', name: 'Listen & Tap', ready: false },
    { id: 'follow', icon: '📦', name: 'Follow Instructions', ready: false },
    { id: 'yes-no', icon: '✅', name: 'Yes / No', ready: false },
    { id: 'story', icon: '📚', name: 'Story Time', ready: false },
  ]},
  { id: 'concepts', icon: '🧩', name: 'Concepts', games: [
    { id: 'where', icon: '📍', name: 'Where Is It?', ready: true },
    { id: 'size', icon: '🐘', name: 'Big & Small', ready: false },
    { id: 'taste', icon: '🍋', name: 'Taste It', ready: false },
  ]},
  { id: 'speaking', icon: '🗣️', name: 'Speaking', games: [
    { id: 'want', icon: '🙋', name: 'I Want…', ready: true },
    { id: 'say-it', icon: '💬', name: 'Say It', ready: false },
    { id: 'finish', icon: '✏️', name: 'Finish the Sentence', ready: false },
    { id: 'tell-me', icon: '🖼️', name: 'Tell Me About It', ready: false },
  ]},
  { id: 'reading', icon: '📖', name: 'Reading', games: [
    { id: 'read-match', icon: '🔗', name: 'Read & Match', ready: false },
    { id: 'pick-word', icon: '🔤', name: 'Pick the Word', ready: false },
    { id: 'read-sentence', icon: '📝', name: 'Read the Sentence', ready: false },
    { id: 'read-aloud', icon: '🔊', name: 'Read Aloud', ready: false },
  ]},
  { id: 'school', icon: '🏫', name: 'School', games: [
    { id: 'classroom', icon: '✏️', name: 'Classroom Words', ready: false },
    { id: 'teacher-says', icon: '🧑‍🏫', name: 'Teacher Says', ready: false },
    { id: 'questions', icon: '❓', name: 'Question Words', ready: false },
  ]},
];

const app = document.getElementById('app')!;

// Remembered per tablet only; storage can be unavailable in private mode.
function loadLang(): Lang {
  try { return (localStorage.getItem('lang') as Lang) || 'en'; } catch { return 'en'; }
}
let lang: Lang = loadLang();
function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
}

function header(title: string, onBack?: () => void): HTMLElement {
  const h = el('header');
  if (onBack) {
    const b = el('button', 'back', '←');
    b.onclick = onBack;
    h.append(b);
  }
  h.append(el('h1', '', title));
  const langs = el('div', 'langs');
  for (const l of LANGS) {
    const b = el('button', l.id === lang ? 'on' : '', l.label);
    b.onclick = () => {
      setLang(l.id);
      langs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    };
    langs.append(b);
  }
  h.append(langs);
  return h;
}

function tile(icon: string, name: string, color: string, onTap?: () => void): HTMLButtonElement {
  const t = el('button', onTap ? 'tile' : 'tile soon');
  t.style.background = color;
  t.append(el('span', 'icon', icon), el('span', '', name));
  if (onTap) t.onclick = onTap;
  return t;
}

function showHome() {
  app.replaceChildren(header('Speech Games'));
  // Recording saves files into the project, so it only exists on the computer's dev server.
  if (import.meta.env.DEV) {
    const r = el('button', 'rec-open', '🎙');
    r.onclick = () => startRecorder(app, lang, showHome);
    app.querySelector('header')!.append(r);
  }
  const grid = el('div', 'grid');
  for (const c of CATEGORIES) grid.append(tile(c.icon, c.name, `var(--${c.id})`, () => showCategory(c)));
  app.append(grid);
}

function showCategory(c: Category) {
  app.replaceChildren(header(`${c.icon} ${c.name}`, showHome));
  const grid = el('div', 'grid');
  for (const g of c.games) {
    grid.append(tile(g.icon, g.name, `var(--${c.id})`, g.ready ? () => startGame(g.id, c) : undefined));
  }
  app.append(grid);
}

function startGame(id: string, c: Category) {
  const back = () => showCategory(c);
  if (id === 'where') startWhere(app, lang, back);
  if (id === 'want') startWant(app, lang, back);
}

showHome();
