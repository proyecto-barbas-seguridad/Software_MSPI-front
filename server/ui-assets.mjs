import { existsSync, readFileSync } from 'node:fs';

const types = { js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8' };

/** Only publish build outputs declared in Vite's manifest, never arbitrary filesystem paths. */
export function loadUiAssets(directory = new URL('../dist/', import.meta.url)) {
  const files = new Map();
  const manifestPath = new URL('.vite/manifest.json', directory);
  if (!existsSync(manifestPath)) return files;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (!manifest['index.html']?.isEntry) throw new Error('Falta la entrada compilada de MSPI.');
  files.set('index.html', { content: readFileSync(new URL('index.html', directory)), type: 'text/html; charset=utf-8' });
  for (const entry of Object.values(manifest)) {
    for (const name of [entry.file, ...(entry.css || [])]) {
      if (!/^assets\/[a-zA-Z0-9_-]+\.(js|css)$/.test(name)) {
        throw new Error('Artefacto de interfaz no permitido en el manifiesto.');
      }
      files.set(name, { content: readFileSync(new URL(name, directory)), type: types[name.split('.').at(-1)] });
    }
  }
  return files;
}
