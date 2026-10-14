import './style.css';
import { el } from './ui/dom';
import { startWhere } from './games/where';
import { startWant } from './games/want';
import { startRecorder } from './parent/recorder';
import { CATEGORIES, type Category } from './catalog';
import { LANGS, label, type Lang } from './core/langs';

// Other files import Lang from here; it now comes from data/langs.json.
export type { Lang };

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
    const b = el('button', l === lang ? 'on' : '', label(l));
    b.onclick = () => {
      setLang(l);
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
