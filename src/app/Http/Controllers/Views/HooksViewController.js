import UserModel from "../../../Models/UserModel.js";

/**
 * Laboratório do custom hook useAxios como View protegida: o HTML vem de
 * resources/views/hooks.ejs e o React monta a tela dentro do #root.
 * As chamadas do hook usam o cookie de sessão, por isso a rota exige login.
 *
 * Rota: GET /hooks (protegida por RedirectIfGuestMiddleware)
 */
export default async function HooksViewController(request, response) {
    const user = await UserModel.findByPk(request.user.id);

    if (!user) {
        return response.redirect("/login");
    }

    return response.status(200).render("hooks", { user });
}
