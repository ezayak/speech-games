import langs from '../../data/langs.json';

export type Lang = keyof typeof langs;
export const LANGS = Object.keys(langs) as Lang[];
export const label = (l: Lang) => langs[l].label;
// Text direction for a language: Arabic variants read right-to-left.
export const dirOf = (l: Lang) => (langs[l].rtl ? 'rtl' : 'ltr');
