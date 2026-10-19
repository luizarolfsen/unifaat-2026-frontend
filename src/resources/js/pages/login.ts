import loginListeners from "../listeners/loginListeners";

// O HTML do formulário agora vem pronto do servidor (resources/views/login.ejs)
// e a checagem "já está logado?" virou middleware no servidor
// (RedirectIfAuthenticatedMiddleware). Aqui sobram só os listeners.
window.addEventListener("DOMContentLoaded", async () => {
  await loginListeners();
});
