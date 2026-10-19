import { Router } from 'express';

import ListUserController from '../../app/Http/Controllers/UserApi/ListUserController.js';
import GetUserController from '../../app/Http/Controllers/UserApi/GetUserController.js';
import GetCurrentUserController from '../../app/Http/Controllers/UserApi/GetCurrentUserController.js';
import CreateUserController from '../../app/Http/Controllers/UserApi/CreateUserController.js';
import UpdateUserController from '../../app/Http/Controllers/UserApi/UpdateUserController.js';
import DeleteUserController from '../../app/Http/Controllers/UserApi/DeleteUserController.js';
import UploadImageController from '../../app/Http/Controllers/UserApi/UploadImageController.js';
import SearchUserController from '../../app/Http/Controllers/UserApi/SearchUserController.js';
import VerifyImageMiddleware from '../../app/Http/Middlewares/VerifyImageMiddleware.js';
import AuthTokenMiddleware from '../../app/Http/Middlewares/AuthTokenMiddleware.js';

export default (() => {
    const router = Router();

    router.get('/', ListUserController);

    router.get('/me', AuthTokenMiddleware, GetCurrentUserController);

    router.get('/:id', AuthTokenMiddleware, GetUserController);

    router.post('/', CreateUserController);

    // Busca em duas etapas: Elasticsearch (ids) → Postgres (WHERE IN)
    router.post('/search', SearchUserController);

    router.put('/:id', UpdateUserController);

    router.post('/image/:id', VerifyImageMiddleware, UploadImageController);

    router.delete('/:id', DeleteUserController);

    return router;
})();