// Renderiza cada posts/*.yaml a out/<nombre>.jpg (1080x1350, JPEG)
const pw = (await import(process.env.PW_PATH || 'playwright')).default;
import Mustache from 'mustache';
import * as yaml from 'js-yaml';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const root = new URL('..', import.meta.url).pathname;
const font = (f) => readFileSync(join(root, 'fonts', f)).toString('base64');
const fonts = `
@font-face{font-family:'Plex Sans';font-weight:400;src:url(data:font/woff2;base64,${font('ibm-plex-sans-latin-400-normal.woff2')})}
@font-face{font-family:'Plex Sans';font-weight:600;src:url(data:font/woff2;base64,${font('ibm-plex-sans-latin-600-normal.woff2')})}
@font-face{font-family:'Plex Mono';font-weight:500;src:url(data:font/woff2;base64,${font('ibm-plex-mono-latin-500-normal.woff2')})}`;
const css = readFileSync(join(root, 'templates/base.css'), 'utf8');

const only = process.argv[2];
const files = readdirSync(join(root, 'posts')).filter(f => f.endsWith('.yaml') && (!only || f.includes(only)));
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const f of files) {
  const data = yaml.load(readFileSync(join(root, 'posts', f), 'utf8'));
  const tpl = readFileSync(join(root, 'templates', `${data.tipo}.html`), 'utf8');
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>${fonts}${css}</style></head><body>${Mustache.render(tpl, data)}</body></html>`;
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const out = join(root, 'out', basename(f, '.yaml') + '.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
  console.log('→', out);
}
await browser.close();
