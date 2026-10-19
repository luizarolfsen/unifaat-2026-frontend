import { taskReassignApi } from "../api/taskReassignApi";
import tasksListRender from "../render/tasksListRender";
import type { TaskListItemElement } from "../types/dom";

export default async function taskReassignHandler(event: Event): Promise<void> {
  const selectElement = event.target as HTMLSelectElement;
  const newUserId = selectElement.value;

  if (!newUserId) return;

  const liElement = selectElement.closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const { taskId, userId: currentUserId } = liElement;

  try {
    await taskReassignApi(currentUserId, taskId, parseInt(newUserId));

    // Recarregar a lista após reatribuir
    await tasksListRender(currentUserId);

    // Mostrar mensagem de sucesso (opcional)
    alert("Tarefa reatribuída com sucesso!");
  } catch (error) {
    console.error("Erro ao reatribuir tarefa:", error);
    alert("Erro ao reatribuir tarefa. Tente novamente.");
  }
}
