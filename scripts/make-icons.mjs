// Ikona apki: bochenek → favicon.svg + PNG dla iOS i manifestu.
// Uruchom: npm run icons
import { writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const DOUGH = '#f7f1e4';

// Grafika w układzie 512×512; `scale` zmniejsza bochenek (maskable wymaga marginesu).
function bread({ background = true, scale = 1 } = {}) {
  const t = `translate(256 262) scale(${scale}) translate(-256 -262)`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="crust" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dba55f"/>
      <stop offset="0.55" stop-color="#c88944"/>
      <stop offset="1" stop-color="#a86a30"/>
    </linearGradient>
    <radialGradient id="shine" cx="0.42" cy="0.3" r="0.55">
      <stop offset="0" stop-color="#f2c983" stop-opacity=".75"/>
      <stop offset="1" stop-color="#f2c983" stop-opacity="0"/>
    </radialGradient>
  </defs>
  ${background ? `<rect width="512" height="512" fill="${DOUGH}"/>` : ''}
  <g transform="${t}">
    <ellipse cx="256" cy="400" rx="196" ry="20" fill="#e6cf9e"/>
    <path d="M64 340c0-100 86-176 192-176s192 76 192 176c0 22-16 36-38 36H102c-22 0-38-14-38-36z" fill="url(#crust)"/>
    <path d="M64 340c0-100 86-176 192-176s192 76 192 176c0 22-16 36-38 36H102c-22 0-38-14-38-36z" fill="url(#shine)"/>
    <path d="M112 364h288" stroke="#8f5a24" stroke-width="10" stroke-linecap="round" opacity=".45"/>
    <g stroke="#f6e6c2" stroke-width="20" stroke-linecap="round" fill="none">
      <path d="M150 286c16-30 38-48 66-58"/>
      <path d="M218 272c16-30 38-48 66-58"/>
      <path d="M286 286c16-30 38-48 66-58"/>
    </g>
    <g fill="#fbf1da" opacity=".7">
      <circle cx="196" cy="200" r="4"/><circle cx="236" cy="182" r="3"/><circle cx="318" cy="196" r="3.5"/>
      <circle cx="270" cy="170" r="2.5"/><circle cx="160" cy="236" r="3"/>
    </g>
  </g>
</svg>`;
}

function png(svg, size, file) {
  const out = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(file, out);
  console.log(`✓ ${file} (${size}×${size})`);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/favicon.svg', bread({ background: false }));
console.log('✓ public/favicon.svg');
png(bread({ scale: 0.92 }), 192, 'public/icons/pwa-192.png');
png(bread({ scale: 0.92 }), 512, 'public/icons/pwa-512.png');
png(bread({ scale: 0.72 }), 512, 'public/icons/maskable-512.png');
png(bread({ scale: 0.86 }), 180, 'public/icons/apple-touch-icon.png');
