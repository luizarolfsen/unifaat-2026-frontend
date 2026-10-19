import UserModel from "../../../Models/UserModel.js";
import bcrypt from "bcrypt";
import SyncUserElasticJob from "../../../Jobs/SyncUserElasticJob.js";

export default async function CreateUserController(request, response) {
    try {
        const { name, email, password, job_title, bio, city, state, birth_date, is_active } = request.body;

        const error = [];

        if (!name) {
            error.push("name obrigatório!");
        }

        if (!email) {
            error.push("email obrigatório!");
        }

        if (!password) {
            error.push("password obrigatório!");
        }

        if (state && state.length !== 2) {
            error.push("state deve ser a sigla da UF, com 2 letras!");
        }

        if (error.length > 0) {
            return response.status(400).json({ error: error });
        }

        // Criptografa a senha com bcrypt (salt rounds: 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name: name,
            email: email,
            password: hashedPassword,
            // Campos de perfil (opcionais): usados pela API de busca
            job_title: job_title,
            bio: bio,
            city: city,
            state: state,
            birth_date: birth_date,
            is_active: is_active
        });

        // Fora do ciclo HTTP: o worker indexa no Elasticsearch depois
        await SyncUserElasticJob.dispatch("default", { id: user.id });

        return response.status(201).json(user);
    } catch (error) {
        console.error(error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return response.status(409).json({
                error: error.errors[0].message
            });
        }

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}