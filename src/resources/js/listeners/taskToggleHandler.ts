import tasksListRender from "../render/tasksListRender";
import { taskUpdateApi } from "../api/taskUpdateApi";
import type { TaskListItemElement } from "../types/dom";

export default async function taskToggleHandler(event: Event): Promise<void> {
  const liElement = (event.target as HTMLElement).closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const { userId: idUser, taskId } = liElement;
  const isDone = (event.target as HTMLInputElement).checked;

  try {
    await taskUpdateApi(idUser, taskId, { is_done: isDone });
    await tasksListRender(idUser);
  } catch (error) {
    alert("Erro ao atualizar tarefa");
    console.error(error);
  }
}
