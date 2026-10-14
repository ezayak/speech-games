import content from '../../data/content.json';
import phrases from '../../data/phrases.json';
import type { Lang } from '../main';

export interface Word { id: string; pic: string; tags: string[]; pos?: string[] }

type RawWord = { pic: string; tags: string[]; pos?: string[] };
export const words: Word[] = Object.entries(content.words as Record<string, RawWord>)
  .map(([id, w]) => ({ id, pic: w.pic, tags: w.tags, pos: w.pos }));

export interface Sentence { id: string; pic: string; group: string; tokens: Record<Lang, string[]> }

type RawSentence = { pic: string; group: string } & Record<Lang, string[]>;
export const sentences: Sentence[] = Object.entries(content.sentences as Record<string, RawSentence>)
  .map(([id, s]) => ({ id, pic: s.pic, group: s.group, tokens: { en: s.en, uk: s.uk, arz: s.arz, ar: s.ar } }));

export const byTag = (tag: string) => words.filter(w => w.tags.includes(tag));

const table = phrases as Record<string, Partial<Record<Lang, string>>>;
export const phraseIds = Object.keys(table);
export const text = (id: string, lang: Lang) => table[id]?.[lang] ?? '';

export function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export const pick = <T>(a: T[], n: number, except: T[] = []) =>
  shuffle(a.filter(x => !except.includes(x))).slice(0, n);
