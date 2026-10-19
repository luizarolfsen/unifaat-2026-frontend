import taskRender from "./taskRender";
import { tasksListApi } from "../api/tasksListApi";

export default async function tasksListRender(idUser: number, page = 1): Promise<void> {
  const container = document.querySelector("#tasks-container");

  if (!container) return;

  container.innerHTML = "";

  const ulElement = document.createElement("ul");
  ulElement.id = "tasks-list";
  ulElement.classList.add("list-group");

  container.append(ulElement);

  const listApi = await tasksListApi(idUser, { page });

  ulElement.innerHTML = "";

  if (listApi.data.length === 0) {
    const emptyElement = document.createElement("li");
    emptyElement.classList.add("list-group-item", "text-center", "text-muted");
    emptyElement.innerText = "Nenhuma tarefa encontrada. Crie uma nova!";
    ulElement.append(emptyElement);
    return;
  }

  listApi.data.forEach((task) => {
    const liElement = taskRender(task, idUser);
    ulElement.append(liElement);
  });
}
