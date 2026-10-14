import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const REC = path.resolve('public/rec');

// public/rec/index.json lists every recording with the time it was saved.
function updateIndex() {
  if (!fs.existsSync(REC)) return;
  const index: Record<string, number> = {};
  for (const lang of fs.readdirSync(REC)) {
    const dir = path.join(REC, lang);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.mp3')) index[`${lang}/${f.slice(0, -4)}`] = Math.round(fs.statSync(path.join(dir, f)).mtimeMs);
    }
  }
  fs.writeFileSync(path.join(REC, 'index.json'), JSON.stringify(index, null, 1));
}

// Dev server only: the recording page sends audio here; it is saved as public/rec/<lang>/<id>.mp3.
function recorder(): Plugin {
  return {
    name: 'recorder',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__rec', (req, res) => {
        const key = decodeURIComponent((req.url ?? '').slice(1));
        if (!/^(en|uk|arz|ar)\/[\w.]+$/.test(key)) { res.statusCode = 400; res.end(); return; }
        const mp3 = path.join(REC, `${key}.mp3`);
        if (req.method === 'DELETE') {
          fs.rmSync(mp3, { force: true });
          updateIndex();
          res.end();
          return;
        }
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        const chunks: Buffer[] = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          fs.mkdirSync(path.dirname(mp3), { recursive: true });
          const tmp = `${mp3}.webm`;
          fs.writeFileSync(tmp, Buffer.concat(chunks));
          try {
            // Trim silence at both ends and even out the loudness.
            execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-af',
              'silenceremove=start_periods=1:start_threshold=-45dB,areverse,' +
              'silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm',
              '-ar', '24000', '-ac', '1', '-b:a', '48k', mp3]);
            updateIndex();
          } catch {
            res.statusCode = 500;
          } finally {
            fs.rmSync(tmp, { force: true });
          }
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  // GitHub Pages serves the app from /speech-games/.
  base: '/speech-games/',
  plugins: [
    recorder(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Speech Games',
        short_name: 'Speech Games',
        display: 'standalone',
        background_color: '#f6f4ef',
        theme_color: '#4f8cc9',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache every sound and picture so the app works offline.
        globPatterns: ['**/*.{js,css,html,svg,png,mp3,json}'],
        // Recordings are requested as ...mp3?v=<time>; still serve them from the offline cache.
        ignoreURLParametersMatching: [/^v$/],
      },
    }),
  ],
});
