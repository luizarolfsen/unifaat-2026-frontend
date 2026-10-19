import UserModel from "../../../Models/UserModel.js";
import bcrypt from "bcrypt";
import SyncUserElasticJob from "../../../Jobs/SyncUserElasticJob.js";

export default async function UpdateUserController(request, response) {
    try {
        const { id } = request.params;
        const { name, email, password } = request.body;

        if (!name || !email) {
            return response.status(400).json({
                error: "Name and email are required"
            });
        }

        if (request.body.state && request.body.state.length !== 2) {
            return response.status(400).json({
                error: "State must be the 2-letter UF"
            });
        }

        const user = await UserModel.findByPk(id);

        if (!user) {
            return response.status(404).json({
                error: "User not found"
            });
        }

        user.name = name;
        user.email = email;

        // Campos de perfil: só altera o que veio no body
        const profileFields = ["job_title", "bio", "city", "state", "birth_date", "is_active"];

        for (const field of profileFields) {
            if (request.body[field] === undefined) {
                continue;
            }

            user[field] = request.body[field];
        }

        // Se password foi fornecido, criptografa e atualiza
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        // Fora do ciclo HTTP: o worker atualiza o documento no Elasticsearch depois
        await SyncUserElasticJob.dispatch("default", { id: user.id });

        return response.json(user);
    } catch (error) {
        console.error(error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return response.status(409).json({
                error: "Email already exists"
            });
        }

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}