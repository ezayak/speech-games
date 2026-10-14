// Makes test MP3s in voice-test/ to compare pronunciation fixes by ear.
// Usage: AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=swedencentral node tools/voice-test.mjs
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'voice-test');
const { AZURE_SPEECH_KEY: KEY, AZURE_SPEECH_REGION: REGION } = process.env;
if (!KEY || !REGION) {
  console.log('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION first.');
  process.exit(1);
}

const TESTS = [
  ['uk-1-plain',    'uk-UA', 'uk-UA-PolinaNeural', 'Я хочу їсти. Мені холодно. Кіт під столом.'],
  ['uk-2-stress',   'uk-UA', 'uk-UA-PolinaNeural', 'Я хочу́ ї́сти. Мені́ хо́лодно. Кіт під столо́м.'],
  ['uk-3-ostap',    'uk-UA', 'uk-UA-OstapNeural',  'Я хочу їсти. Мені холодно. Кіт під столом.'],
  ['arz-1-now',     'ar-EG', 'ar-EG-SalmaNeural',  'القُطّة تَحْت التَّرابيزة. أنا عايز آكل.'],
  ['arz-2-plain',   'ar-EG', 'ar-EG-SalmaNeural',  'القطة تحت الترابيزة. أنا عايز آكل.'],
  ['arz-3-spoken',  'ar-EG', 'ar-EG-SalmaNeural',  'الأطّة تحت الترابيزة. أنا عايز آكُل.'],
  ['arz-4-shakir',  'ar-EG', 'ar-EG-ShakirNeural', 'القطة تحت الترابيزة. أنا عايز آكل.'],
];

fs.mkdirSync(out, { recursive: true });
for (const [name, lang, voice, text] of TESTS) {
  const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${voice}">` +
    `<prosody rate="-15%">${text}</prosody></voice></speak>`;
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
  if (!res.ok) throw new Error(`${name}: Azure ${res.status}: ${await res.text()}`);
  fs.writeFileSync(path.join(out, `${name}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log(`voice-test/${name}.mp3`);
  await new Promise(r => setTimeout(r, 3100));
}
