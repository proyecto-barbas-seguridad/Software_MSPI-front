import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { createStyleCache } from './app/Providers';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el contenedor de MSPI.');
const nonce = document.querySelector<HTMLMetaElement>('meta[name="mspi-style-nonce"]')?.content;
const cache = createStyleCache(nonce === '__MSPI_STYLE_NONCE__' ? undefined : nonce);
createRoot(root).render(<StrictMode><App cache={cache} /></StrictMode>);
