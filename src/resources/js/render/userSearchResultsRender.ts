import type { PaginatedResponse, User } from "../types/api";

export default function userSearchResultsRender(response: PaginatedResponse<User>): void {
  const container = document.querySelector<HTMLDivElement>("#assign-search-results");

  if (!container) return;

  container.innerHTML = "";

  if (response.total === 0) {
    container.innerHTML = `<p class="text-muted small">Nenhum usuário encontrado.</p>`;
    return;
  }

  const totalEl = document.createElement("p");
  totalEl.classList.add("small", "text-muted");
  totalEl.textContent = `${response.total} usuário(s) encontrado(s)`;
  container.append(totalEl);

  response.data.forEach((user) => {
    const card = document.createElement("div");
    card.classList.add("d-flex", "justify-content-between", "align-items-center", "border", "rounded", "p-2", "mb-2");

    const location = [user.city, user.state].filter(Boolean).join(" / ");

    card.innerHTML = `
      <div>
        <strong>${user.name}</strong><br>
        <span class="small text-muted">${user.email}</span><br>
        <span class="small">${user.job_title ?? ""}${location ? " · " + location : ""}</span>
      </div>
      <button
        type="button"
        class="btn btn-sm btn-outline-primary assign-choose-btn"
        data-user-id="${user.id}"
        data-user-name="${user.name}"
        data-user-email="${user.email}"
      >Escolher</button>
    `;

    container.append(card);
  });
}
