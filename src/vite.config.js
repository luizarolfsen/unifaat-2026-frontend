import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
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

export default defineConfig({
    root: 'resources',
    plugins: [
        react(),
        copyStaticAssets('resources', '../public', ['404.html', 'example.json', 'img'])
    ],
    server: {
        open: (process.env.IS_DOCKER !== "true"),
        hmr: true,
        host: true,
        port: (process.env.IS_DOCKER == "true") ? 5172 : 5173,
    },
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
                "./resources/js/pages/login.tsx",
                "./resources/js/pages/tasks.tsx",
                "./resources/js/pages/users.tsx",
                "./resources/js/pages/counter.tsx",
                "./resources/js/pages/refs.tsx",
                "./resources/js/pages/hooks.tsx"
            ],
            output: {
                assetFileNames: 'src/[name].[hash][extname]',
                entryFileNames: 'src/[name].[hash].js',
                chunkFileNames: 'src/[name].[hash].js',
            }
        }
    }
})
