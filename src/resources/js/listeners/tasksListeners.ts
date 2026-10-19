import tasksListRender from "../render/tasksListRender";
import { clearUserId } from "../utils/getUserIdFromAuth";

export default async function tasksListeners(idUser: number): Promise<void> {
  const addTaskBtn = document.querySelector<HTMLButtonElement>("#add-task-btn");
  const logoutBtn = document.querySelector<HTMLButtonElement>("#logout-btn");

  addTaskBtn?.addEventListener("click", async () => {
    const taskInput = document.querySelector<HTMLInputElement>("#task-input");
    const taskName = taskInput?.value.trim() ?? "";

    if (!taskName) {
      alert("Digite uma tarefa!");
      return;
    }

    try {
      const { taskCreateApi } = await import("../api/taskCreateApi");
      await taskCreateApi(idUser, { name: taskName });
      if (taskInput) taskInput.value = "";
      await tasksListRender(idUser);
    } catch (error) {
      alert("Erro ao criar tarefa");
      console.error(error);
    }
  });

  logoutBtn?.addEventListener("click", () => {
    clearUserId();
    // O cookie é deletado automaticamente na próxima validação
    window.location.href = "/login";
  });
}
