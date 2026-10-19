import TaskModel from "../../../Models/TaskModel.js";

export default async function CreateTaskController(request, response) {
    try {
        const idUser = request.user.id;
        const { name, is_done } = request.body;

        const error = [];

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
