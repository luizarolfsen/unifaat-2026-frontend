import TaskModel from "../../../Models/TaskModel.js";

export default async function ListTaskController(request, response) {
    try {
        const idUser = request.user.id;
        const pageRequest = Number(request.query.page) || 1;
        const limitRequest = Number(request.query.limit) || 10;

        const page = (pageRequest < 1) ? 1 : pageRequest;
        const limit = (limitRequest > 20) ? 20 : ((limitRequest < 1) ? 10 : limitRequest);
        const offset = (page - 1) * limit;

        let next = null;

        const { rows, count: total } = await TaskModel.findAndCountAll({
            where: { id_user: idUser },
            order: [['id', 'ASC']],
            limit: limit + 1,
            offset: offset,
            distinct: true
        });

        const tasks = rows;

        if (tasks.length > limit) {
            next = page + 1;
            tasks.pop();
        }

        return response.json({
            page: page,
            limit: limit,
            total: total,
            next: next,
            data: tasks
        });
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
