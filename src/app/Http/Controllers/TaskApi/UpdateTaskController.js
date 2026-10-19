import TaskModel from "../../../Models/TaskModel.js";
import UserModel from "../../../Models/UserModel.js";

export default async function UpdateTaskController(request, response) {
    try {
        const { idUser, id } = request.params;
        const { name, is_done } = request.body;

        // Verifica se o usuário existe
        const user = await UserModel.findByPk(idUser);
        if (!user) {
            return response.status(404).json({
                error: "User not found"
            });
        }

        const task = await TaskModel.findOne({
            where: { id: id, id_user: idUser }
        });

        if (!task) {
            return response.status(404).json({
                error: "Task not found"
            });
        }

        if (name !== undefined) {
            task.name = name;
        }

        if (is_done !== undefined) {
            task.is_done = is_done;
        }

        await task.save();

        return response.json(task);
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
