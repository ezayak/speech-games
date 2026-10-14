import type { Lang } from '../main';
import { phraseIds, text } from '../core/content';
import { play, recordedAt, setRecorded } from '../core/audio';
import { el } from '../ui/dom';
import { GAMES } from '../catalog';
import { dirOf } from '../core/langs';

const SECTIONS: { name: string; match: (id: string) => boolean }[] = [
  // One tab per game that has sounds, named as on the home screen.
  ...GAMES.filter(g => g.sounds).map(g => ({ name: `${g.icon} ${g.name}`, match: (id: string) => id.startsWith(g.sounds!) })),
  { name: '🔤 Words', match: id => id.startsWith('w.') || id.startsWith('pos.') },
  { name: '⭐ Praise', match: id => id.startsWith('ui.') },
];

export function startRecorder(app: HTMLElement, lang: Lang, onExit: () => void) {
  let stream: MediaStream | null = null;
  let active: MediaRecorder | null = null;

  const back = el('button', 'back', '←');
  back.onclick = () => {
    active?.stop();
    stream?.getTracks().forEach(t => t.stop());
    onExit();
  };
  const bar = el('header');
  bar.append(back, el('h1', '', `🎙 ${lang.toUpperCase()}`));
  const tabs = el('div', 'rec-tabs');
  const list = el('div', 'rec-list');
  list.dir = dirOf(lang);
  app.replaceChildren(bar, tabs, list);

  for (const s of SECTIONS) {
    const b = el('button', '', s.name);
    b.onclick = () => {
      tabs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      show(s.match);
    };
    tabs.append(b);
  }

  function show(match: (id: string) => boolean) {
    list.replaceChildren();
    for (const id of phraseIds.filter(match)) {
      const t = text(id, lang);
      if (!t) continue;
      const key = `${lang}/${id}`;
      // Word cards (say.eat.0) are indented under their phrase.
      const row = el('div', /^say\.\w+\.\d+$/.test(id) ? 'rec-row card' : 'rec-row');
      row.classList.toggle('mine', !!recordedAt(key));
      const listen = el('button', '', '🔊');
      listen.onclick = () => play(id, lang);
      const rec = el('button', '', '⏺');
      rec.onclick = () => toggle(id, rec, row);
      const del = el('button', 'rec-del', '🗑');
      del.onclick = async () => {
        const res = await fetch(`/__rec/${key}`, { method: 'DELETE' });
        if (!res.ok) return;
        setRecorded(key, null);
        row.classList.remove('mine');
      };
      row.append(el('span', 'rec-text', t), listen, rec, del);
      list.append(row);
    }
  }

  async function toggle(id: string, btn: HTMLButtonElement, row: HTMLElement) {
    if (active) { active.stop(); return; }
    stream ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => {
      active = null;
      btn.textContent = '⏺';
      row.classList.remove('recording');
      const res = await fetch(`/__rec/${lang}/${id}`, { method: 'POST', body: new Blob(chunks) });
      if (!res.ok) { btn.textContent = '⚠️'; return; }
      setRecorded(`${lang}/${id}`, Date.now());
      row.classList.add('mine');
      play(id, lang);
    };
    rec.start();
    active = rec;
    btn.textContent = '⏹';
    row.classList.add('recording');
  }

  (tabs.firstElementChild as HTMLButtonElement).click();
}
