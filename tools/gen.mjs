// Expands data/content.json into data/phrases.json, then (with an Azure key) makes missing/changed MP3s.
// Usage: AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=westeurope node tools/gen.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const content = JSON.parse(fs.readFileSync(path.join(root, 'data/content.json'), 'utf8'));

const VOICES = { en: 'en-US-AnaNeural', uk: 'uk-UA-PolinaNeural', arz: 'ar-EG-SalmaNeural', ar: 'ar-EG-SalmaNeural' };
const XML_LANG = { en: 'en-US', uk: 'uk-UA', arz: 'ar-EG', ar: 'ar-EG' };
const LANGS = Object.keys(VOICES);

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => {
  if (!(k in vars)) throw new Error(`missing {${k}} in "${tpl}"`);
  return vars[k];
});
const cap = s => s[0].toUpperCase() + s.slice(1);

// Placeholder values for one sentence; Ukrainian needs case forms, Arabic the definite form.
function vars(lang, obj, pos, ref) {
  const o = obj[lang], r = ref[lang], p = pos[lang];
  if (lang === 'en') return { obj: o.t, ref: r.t, pos: p };
  if (lang === 'uk') return { obj: o.t, Obj: cap(o.t), objAcc: o.acc, pos: fill(p.at, r), posTo: fill(p.to, r) };
  return { obj: o.def, ref: r.def, pos: p };
}

const phrases = {};
const words = Object.entries(content.words);
for (const [id, w] of words) phrases[`w.${id}`] = Object.fromEntries(LANGS.map(l => [l, w[l].t]));
for (const [id, p] of Object.entries(content.positions)) {
  phrases[`pos.${id}`] = Object.fromEntries(LANGS.map(l => [l, l === 'uk' ? p.uk.w : p[l]]));
}
for (const [id, p] of Object.entries(content.phrases)) phrases[`ui.${id}`] = p;

const objs = words.filter(([, w]) => w.tags.includes('where-obj'));
const refs = words.filter(([, w]) => w.tags.includes('where-ref'));
for (const [tid, tpl] of Object.entries(content.templates)) {
  for (const [oid, obj] of objs) for (const [rid, ref] of refs) for (const pid of ref.pos) {
    const pos = content.positions[pid];
    phrases[`${tid}.${oid}.${pid}.${rid}`] = Object.fromEntries(LANGS.map(l => [l, fill(tpl[l], vars(l, obj, pos, ref))]));
  }
}

fs.writeFileSync(path.join(root, 'data/phrases.json'), JSON.stringify(phrases, null, 1));
console.log(`phrases.json: ${Object.keys(phrases).length} phrases`);

// ---- audio ----
const audioDir = path.join(root, 'public/audio');
const manifestPath = path.join(audioDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

const todo = [];
for (const [id, t] of Object.entries(phrases)) for (const l of LANGS) {
  const key = `${l}/${id}`;
  if (manifest[key] !== t[l] || !fs.existsSync(path.join(audioDir, `${key}.mp3`))) todo.push({ key, lang: l, text: t[l] });
}
console.log(`audio: ${todo.length} files missing or changed`);

const { AZURE_SPEECH_KEY: KEY, AZURE_SPEECH_REGION: REGION } = process.env;
if (!todo.length) process.exit(0);
if (!KEY || !REGION) {
  console.log('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to generate audio.');
  process.exit(0);
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function synth(lang, text) {
  const ssml = `<speak version="1.0" xml:lang="${XML_LANG[lang]}"><voice name="${VOICES[lang]}">` +
    `<prosody rate="-15%">${esc(text)}</prosody></voice></speak>`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'speech-games',
      },
      body: ssml,
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    // Free tier allows ~20 requests/minute; wait and retry when throttled.
    if (res.status === 429 && attempt < 5) { await sleep(30000); continue; }
    throw new Error(`Azure ${res.status}: ${await res.text()}`);
  }
}

let done = 0;
for (const { key, lang, text } of todo) {
  const file = path.join(audioDir, `${key}.mp3`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, await synth(lang, text));
  manifest[key] = text;
  // Save progress after every file so an interrupted run resumes where it stopped.
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
  console.log(`${++done}/${todo.length} ${key}`);
  await sleep(3100);
}
