import fs from 'node:fs';
import path from 'node:path';
import CONSTANTS from '../bootstrap/config.js';

/**
 * Ponte entre a View (servidor) e o Vite (frontend compilado).
 *
 * O Vite gera os arquivos com hash no nome (ex.: src/login.COZhj-27.js), então
 * a View não sabe o nome final. Com build.manifest: true (vite.config.js), o
 * Vite grava em public/.vite/manifest.json o mapa "arquivo fonte -> compilado".
 *
 * Uso na view: <%- vite(["css/app.css", "js/app.ts"]) %>
 * Devolve as tags <link> e <script> já com os nomes compilados.
 */
export default function vite(entries) {
    // Lido a cada chamada: o "vite build --watch" reescreve o manifest a cada mudança
    const manifestPath = path.join(CONSTANTS.DIR, 'public', '.vite', 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    const styles = new Set();
    const scripts = [];

    for (const entry of entries) {
        const chunk = manifest[entry];

        if (!chunk) {
            throw new Error(`Entrada "${entry}" não existe no manifest do Vite (faltou no rollupOptions.input?)`);
        }

        collectCss(manifest, entry, styles);

        if (chunk.file.endsWith('.css')) {
            styles.add(chunk.file);
            continue;
        }

        scripts.push(chunk.file);
    }

    const tags = [];

    for (const file of styles) {
        tags.push(`<link rel="stylesheet" href="/${file}">`);
    }

    for (const file of scripts) {
        tags.push(`<script type="module" src="/${file}"></script>`);
    }

    return tags.join('\n');
}

/**
 * Um chunk JS pode importar outros chunks que têm CSS próprio:
 * percorre os imports para não esquecer nenhuma folha de estilo.
 */
function collectCss(manifest, key, styles) {
    const chunk = manifest[key];

    if (!chunk) {
        return;
    }

    for (const file of chunk.css ?? []) {
        styles.add(file);
    }

    for (const imported of chunk.imports ?? []) {
        collectCss(manifest, imported, styles);
    }
}
