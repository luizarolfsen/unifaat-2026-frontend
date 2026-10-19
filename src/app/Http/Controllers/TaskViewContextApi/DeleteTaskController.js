import TaskModel from "../../../Models/TaskModel.js";

export default async function DeleteTaskController(request, response) {
    try {
        const idUser = request.user.id;
        const { id } = request.params;

        const task = await TaskModel.findOne({
            where: { id: id, id_user: idUser }
        });

        if (!task) {
            return response.status(404).json({
                error: "Task not found"
            });
        }

        await task.destroy();

        return response.status(204).send();
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
