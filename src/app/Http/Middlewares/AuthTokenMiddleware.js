import jwt from "jsonwebtoken";

export default function AuthTokenMiddleware(request, response, next) {
    try {
        // Procura o token primeiro no header Authorization, depois no cookie
        let token = null;

        const authHeader = request.headers.authorization;
        if (authHeader) {
            token = authHeader.replace("Bearer ", "");
        } else if (request.cookies.auth_token) {
            token = request.cookies.auth_token;
        }

        if (!token) {
            return response.status(401).json({
                error: "Missing authentication token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        request.user = decoded;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return response.status(401).json({
                error: "Token expired"
            });
        }

        return response.status(401).json({
            error: "Invalid token"
        });
    }
}
