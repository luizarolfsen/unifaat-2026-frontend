import express from 'express';
import chalk from 'chalk';

import path from 'node:path';

import router from './routes/router.js';
import app from "./bootstrap/app.js";
import CONSTANTS from './bootstrap/config.js';
import vite from './utils/vite.js';

/** Inicializador */
app();

/** */
/** Iniciar roteador */
const web = express();

/** Views: o HTML montado pelo servidor (EJS), em resources/views */
web.set('view engine', 'ejs');
web.set('views', path.join(CONSTANTS.DIR, 'resources', 'views'));

/** Disponível em todas as views: <%- vite(["css/app.css"]) %> devolve as tags dos arquivos compilados */
web.locals.vite = vite;

/** Registrar as Rotas */
web.use('/', router);

const port = process.env.NODE_WEB_PORT;

web.listen(port, () => {
    console.log(chalk.green(`Servidor node web rodando na porta ${port}`));
});

