import jwt from "jsonwebtoken";

/**
 * Middleware de página (View).
 *
 * Se o usuário JÁ tem sessão válida (cookie auth_token), não faz sentido
 * mostrar o login: redireciona para as tarefas ANTES de o HTML ser montado.
 * Sem cookie, ou com token inválido/expirado, segue para o controller.
 *
 * Antes isso era feito no navegador (checkAuthentication no login.ts),
 * depois que a página já tinha chegado. Com arquivo estático não havia
 * outro jeito: o Nginx não sabe o que é um JWT.
 */
export default function RedirectIfAuthenticatedMiddleware(request, response, next) {
    const token = request.cookies.auth_token;

    if (!token) {
        return next();
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next();
    }

    return response.redirect("/tasks.html");
}
