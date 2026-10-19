/**
 * Tela de login como View: o HTML vem de resources/views/login.ejs.
 *
 * Rota: GET /login (protegida por RedirectIfAuthenticatedMiddleware)
 */
export default function LoginViewController(request, response) {
    return response.status(200).render("login");
}
