import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'

// 404.html, example.json e img/ ficam soltos na raiz de resources/ (junto com
// os .html de entrada), não numa pasta public/ — então o mecanismo padrão de
// "publicDir" do Vite não os copia sozinho. Esse plugin copia esses caminhos
// específicos pra dentro do outDir a cada build (inclusive em --watch).
function copyStaticAssets(root, outDir, items) {
    return {
        name: 'copy-static-assets',
        closeBundle() {
            const resolvedRoot = path.resolve(__dirname, root)
            const resolvedOutDir = path.resolve(resolvedRoot, outDir)
            for (const item of items) {
                fs.cpSync(
                    path.join(resolvedRoot, item),
                    path.join(resolvedOutDir, item),
                    { recursive: true }
                )
            }
        }
    }
}

// Vite.config dedicado ao container do compilador: "resources" e "public"
// são pastas irmãs, direto em /app (ver Dockerfile ao lado), como no src/
// do projeto. A diferença para o vite.config.js principal (usado no HMR
// local) é só a ausência do bloco "server": aqui não há servidor, só build.
export default defineConfig({
    root: 'resources',
    plugins: [
        copyStaticAssets('resources', '../public', ['404.html', 'example.json', 'img'])
    ],
    resolve: {
        alias: {
            '@fa': path.resolve(__dirname, 'node_modules/@fortawesome/fontawesome-free')
        },
    },
    build: {
        outDir: '../public',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: [
                "./resources/index.html",
                "./resources/tasks.html",
                // Entradas avulsas, usadas pelas Views (EJS) via helper vite()
                "./resources/css/app.css",
                "./resources/js/app.ts",
                "./resources/js/pages/login.ts"
            ],
            output: {
                assetFileNames: 'src/[name].[hash][extname]',
                entryFileNames: 'src/[name].[hash].js',
                chunkFileNames: 'src/[name].[hash].js',
            }
        }
    }
})
