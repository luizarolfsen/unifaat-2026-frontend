import { Router } from 'express';

import ListTaskController from '../../app/Http/Controllers/TaskViewContextApi/ListTaskController.js';
import GetTaskController from '../../app/Http/Controllers/TaskViewContextApi/GetTaskController.js';
import CreateTaskController from '../../app/Http/Controllers/TaskViewContextApi/CreateTaskController.js';
import UpdateTaskController from '../../app/Http/Controllers/TaskViewContextApi/UpdateTaskController.js';
import DeleteTaskController from '../../app/Http/Controllers/TaskViewContextApi/DeleteTaskController.js';

export default (() => {
    const router = Router();

    router.get('/', ListTaskController);

    router.get('/:id', GetTaskController);

    router.post('/', CreateTaskController);

    router.put('/:id', UpdateTaskController);

    router.delete('/:id', DeleteTaskController);

    return router;
})();
