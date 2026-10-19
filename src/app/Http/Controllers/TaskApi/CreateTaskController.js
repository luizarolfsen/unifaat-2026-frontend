import TaskModel from "../../../Models/TaskModel.js";
import UserModel from "../../../Models/UserModel.js";

export default async function CreateTaskController(request, response) {
    try {
        const { idUser } = request.params;
        const { name, is_done } = request.body;

        const error = [];

        // Verifica se o usuário existe
        const user = await UserModel.findByPk(idUser);
        if (!user) {
            return response.status(404).json({
                error: "User not found"
            });
        }

        if (!name) {
            error.push("name obrigatório!");
        }

        if (error.length > 0) {
            return response.status(400).json({ error: error });
        }

        const task = await TaskModel.create({
            name: name,
            is_done: is_done || false,
            id_user: idUser
        });

        return response.status(201).json(task);
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
