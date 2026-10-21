import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { handleChat } from './server/chat.js';
import { mockChatResponse } from './server/mockChat.js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Lokalny odpowiednik funkcji Vercel /api/chat (npm run dev / npm run preview).
// Bez ANTHROPIC_API_KEY w .env odpowiada tryb próbny — nic nie kosztuje.
function chlebDevApi(env) {
  const mount = (server) => {
    server.middlewares.use('/api/chat', async (req, res) => {
      try {
        const raw = req.method === 'POST' ? await readBody(req) : undefined;
        const body = raw ? JSON.parse(raw) : {};
        const request = new Request('http://localhost/api/chat', {
          method: req.method,
          headers: { 'content-type': 'application/json', 'x-chleb-token': String(req.headers['x-chleb-token'] ?? '') },
          body: raw,
        });
        const response =
          req.method === 'POST' && !body.ping && !env.ANTHROPIC_API_KEY ? mockChatResponse(body) : await handleChat(request, { ...env, CHLEB_DEV: '1' });
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        if (response.body) for await (const chunk of response.body) res.write(chunk);
        res.end();
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ kind: 'server', message: String(err?.message ?? err) }));
      }
    });
  };
  return { name: 'chleb-dev-api', configureServer: mount, configurePreviewServer: mount };
}

export default defineConfig(({ mode }) => {
  // Wszystkie zmienne z .env — TYLKO dla lokalnego serwera. Do przeglądarki trafiają
  // wyłącznie zmienne z prefiksem VITE_ (a takich z sekretami nie ma).
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    plugins: [
      react(),
      chlebDevApi(env),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] },
        manifest: {
          name: 'C.H.L.E.B — mój agent aktorski',
          short_name: 'Chleb',
          description: 'Prywatny agent aktorski: castingi, składniki na dziś i czat z Chlebem.',
          lang: 'pl',
          id: '/',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#ede0d4',
          theme_color: '#ede0d4',
          icons: [
            { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
  };
});
