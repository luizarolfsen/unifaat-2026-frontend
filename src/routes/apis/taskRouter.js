import { Router } from 'express';

import ListTaskController from '../../app/Http/Controllers/TaskApi/ListTaskController.js';
import GetTaskController from '../../app/Http/Controllers/TaskApi/GetTaskController.js';
import CreateTaskController from '../../app/Http/Controllers/TaskApi/CreateTaskController.js';
import UpdateTaskController from '../../app/Http/Controllers/TaskApi/UpdateTaskController.js';
import DeleteTaskController from '../../app/Http/Controllers/TaskApi/DeleteTaskController.js';

export default (() => {
    const router = Router({ mergeParams: true });

    router.get('/', ListTaskController);

    router.get('/:id', GetTaskController);

    router.post('/', CreateTaskController);

    router.put('/:id', UpdateTaskController);

    router.delete('/:id', DeleteTaskController);

    return router;
})();
