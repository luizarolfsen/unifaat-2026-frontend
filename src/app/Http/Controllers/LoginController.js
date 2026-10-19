import UserModel from "../../Models/UserModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * Faz login de um usuário e gera um JWT.
 * 
 * Rota: POST /api/login
 * Body esperado (application/x-www-form-urlencoded):
 *   - email: email do usuário
 *   - password: senha do usuário (em texto plano)
 * 
 * Resposta:
 *   - token: JWT contendo o id do usuário
 */
export default async function LoginController(request, response) {
    try {
        const { email, password } = request.body;

        // Valida se email e senha foram fornecidos
        if (!email || !password) {
            return response.status(400).json({
                error: "Email and password are required"
            });
        }

        // Busca o usuário pelo email
        const user = await UserModel.findOne({
            where: {
                email: email
            }
        });


        // Se usuário não existe
        if (!user) {
            return response.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Compara a senha fornecida com a senha criptografada armazenada
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return response.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Gera JWT com o id do usuário
        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        // Define o cookie com o JWT (HttpOnly, SameSite)
        response.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 10 * 60 * 1000  // 10 minutos em milissegundos
        });

        // Login bem-sucedido, retorna o userId
        return response.status(200).json({
            userId: user.id
        });
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
