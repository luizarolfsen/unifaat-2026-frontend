import type { User } from "../types/api";
import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import userSearchResultsRender from "../render/userSearchResultsRender";
import tasksListRender from "../render/tasksListRender";

export default function assignTaskModalListeners(idUser: number): void {
  let selectedUser: User | null = null;

  const searchBtn = document.querySelector<HTMLButtonElement>("#assign-search-btn");
  const searchValueInput = document.querySelector<HTMLInputElement>("#assign-search-value");
  const searchFieldSelect = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const resultsContainer = document.querySelector<HTMLDivElement>("#assign-search-results");
  const selectedUserDiv = document.querySelector<HTMLDivElement>("#assign-selected-user");
  const submitBtn = document.querySelector<HTMLButtonElement>("#assign-task-submit");
  const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
  const cancelBtn = document.querySelector<HTMLButtonElement>("[data-bs-dismiss='modal']");

  async function doSearch(): Promise<void> {
    const value = searchValueInput?.value.trim() ?? "";
    const field = searchFieldSelect?.value ?? "name";

    if (!value) {
      if (resultsContainer) resultsContainer.innerHTML = `<p class="text-warning small">Digite algo para buscar.</p>`;
      return;
    }

    try {
      const filters = { [field]: value } as Record<string, string>;
      const response = await userSearchApi(filters, 1, 10);
      userSearchResultsRender(response);
    } catch {
      if (resultsContainer) resultsContainer.innerHTML = `<p class="text-danger small">Erro ao buscar usuários.</p>`;
    }
  }

  searchBtn?.addEventListener("click", doSearch);

  searchValueInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  // Delegação de evento para os botões "Escolher"
  resultsContainer?.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    if (!target.classList.contains("assign-choose-btn")) return;

    const userId = Number(target.dataset.userId);
    const userName = target.dataset.userName ?? "";
    const userEmail = target.dataset.userEmail ?? "";

    selectedUser = { id: userId, name: userName, email: userEmail } as User;

    if (selectedUserDiv) {
      selectedUserDiv.innerHTML = `<p class="text-success small">Atribuir para: <strong>${userName}</strong> (${userEmail})</p>`;
    }
  });

  submitBtn?.addEventListener("click", async () => {
    const taskName = taskNameInput?.value.trim() ?? "";

    if (!taskName) {
      alert("Digite o nome da tarefa.");
      return;
    }

    if (!selectedUser) {
      alert("Escolha um usuário.");
      return;
    }

    const targetUser = selectedUser;

    try {
      await taskCreateApi(targetUser.id, { name: taskName });

      const successMsg = `Tarefa criada para ${targetUser.name}`;

      // Fecha o modal clicando no botão Cancelar (data-bs-dismiss)
      cancelBtn?.click();

      // Limpa os campos
      if (taskNameInput) taskNameInput.value = "";
      if (searchValueInput) searchValueInput.value = "";
      if (resultsContainer) resultsContainer.innerHTML = "";
      if (selectedUserDiv) selectedUserDiv.innerHTML = "";
      selectedUser = null;

      // Se a tarefa foi criada para o próprio usuário logado, recarrega a lista
      if (targetUser.id === idUser) {
        await tasksListRender(idUser);
      }

      alert(successMsg);
    } catch {
      if (resultsContainer) {
        const errEl = document.createElement("p");
        errEl.classList.add("text-danger", "small");
        errEl.textContent = "Erro ao criar tarefa.";
        resultsContainer.prepend(errEl);
      }
    }
  });
}
