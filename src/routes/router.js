/**
 * Arquivo principal de rotas da aplicação.
 * Define todas as rotas da API REST e servindo de arquivos estáticos.
 */

import { Router } from 'express';
import express from 'express';
import path from 'path';
import CONSTANTS from '../bootstrap/config.js';
import ListFilesController from '../app/Http/Controllers/ListFilesController.js';
import GetFileController from '../app/Http/Controllers/GetFileController.js';
import Return404Controller from '../app/Http/Controllers/Return404Controller.js';
import userRouter from './apis/userRouter.js';
import taskRouter from './apis/taskRouter.js';
import taskContextRouter from './apis/taskContextRouter.js';
import fileUpload from 'express-fileupload';
import swaggerUi from 'swagger-ui-express';
import LoginController from '../app/Http/Controllers/LoginController.js';
import AuthMiddleware from '../app/Http/Middlewares/AuthMiddleware.js';
import AuthTokenMiddleware from '../app/Http/Middlewares/AuthTokenMiddleware.js';
import CorsMiddleware from '../app/Http/Middlewares/CorsMiddleware.js';
import ParseCookiesMiddleware from '../app/Http/Middlewares/ParseCookiesMiddleware.js';
import SwaggerDoc from '../app/Http/SwaggerDoc.js';
import HelloWorldController from '../app/Http/Controllers/Views/HelloWorldController.js';
import LoginViewController from '../app/Http/Controllers/Views/LoginViewController.js';
import RedirectIfAuthenticatedMiddleware from '../app/Http/Middlewares/RedirectIfAuthenticatedMiddleware.js';

const router = Router();

/**
 * Middleware de CORS
 * Libera o acesso à API para o front-end de desenvolvimento (Vite)
 */
router.use(CorsMiddleware);

/**
 * Middleware para parsear cookies
 * Permite ler cookies nas requisições
 */
router.use(ParseCookiesMiddleware);

/**
 * Middleware para parsear requisições com Content-Type: application/json
 * Permite receber e processar dados JSON no body das requisições
 */
router.use(express.json());

/**
 * Middleware para parsear requisições com Content-Type: application/x-www-form-urlencoded
 * Permite receber dados enviados por formulários HTML tradicionais
 */
router.use(express.urlencoded({ extended: true }));

/**
 * Middleware para upload de arquivos
 * Adiciona suporte a multipart/form-data para envio de arquivos
 */
router.use(fileUpload());

/**
 * Rota para obter um arquivo específico
 * GET /arquivo?file=nome_do_arquivo
 */
router.get("/arquivo", GetFileController);

/**
 * Rota raiz que lista todos os arquivos disponíveis na pasta 'public'
 * GET /
 */
router.get('/', ListFilesController);

/**
 * Middleware para servir arquivos estáticos da pasta 'public'
 * Qualquer arquivo em public/ será acessível diretamente
 * Ex: public/teste.css será acessível em /teste.css
 */
router.use(express.static(path.join(CONSTANTS.DIR, 'public')));

/**
 * ========================================
 * VIEWS (HTML montado no servidor com EJS)
 * ========================================
 */

/** Hello world: GET /hello?nome=Luan */
router.get('/hello', HelloWorldController);

/** Login: se já tem sessão válida, o middleware redireciona antes do HTML existir */
router.get('/login', RedirectIfAuthenticatedMiddleware, LoginViewController);

/**
 * Rota de documentação Swagger
 * Usa swagger-ui-express com o spec gerado pelo DocSwaggerController.
 */
router.use('/docs', swaggerUi.serve, swaggerUi.setup(SwaggerDoc()));

/**
 * ========================================
 * ROTAS DE API REST
 * ========================================
 */

/** Login */
router.post('/api/login', LoginController);

/** Router para usuários */
router.use("/users", userRouter);

/** Router para tarefas aninhadas em usuários */
router.use("/users/:idUser/tasks", taskRouter);

/** Router para tarefas do usuário autenticado (API contextual — idUser vem do JWT, não da URL) */
router.use("/me/tasks", AuthTokenMiddleware, taskContextRouter);

/**
 * Fallback 404 para requisições não encontradas
 * Captura qualquer rota que não foi definida acima
 * e retorna um erro 404 apropriado
 */
router.use(Return404Controller);

export default router;

