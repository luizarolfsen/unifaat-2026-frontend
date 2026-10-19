import tasksListRender from "../render/tasksListRender";
import tasksListeners from "../listeners/tasksListeners";
import { checkAuthentication, redirectToLogin } from "../utils/checkAuthentication";
import { setUserId, clearUserId } from "../utils/getUserIdFromAuth";

window.addEventListener("DOMContentLoaded", async () => {
  try {
    // Valida o token antes de renderizar
    const auth = await checkAuthentication();

    if (!auth.authenticated || auth.idUser === undefined) {
      clearUserId();
      redirectToLogin();
      return;
    }

    const { idUser } = auth;
    setUserId(idUser);

    await tasksListRender(idUser);
    await tasksListeners(idUser);
  } catch (error) {
    console.error("Falha ao carregar tarefas:", error);
    clearUserId();
    redirectToLogin();
  }
});
