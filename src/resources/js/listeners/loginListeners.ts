import { AxiosError } from "axios";
import { loginApi } from "../api/loginApi";
import { setUserId } from "../utils/getUserIdFromAuth";

export default async function loginListeners(): Promise<void> {
  const formElement = document.querySelector<HTMLFormElement>("#login-form");
  const messageElement = document.querySelector<HTMLDivElement>("#login-message");

  formElement?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector<HTMLInputElement>("#email-input")?.value ?? "";
    const password = document.querySelector<HTMLInputElement>("#password-input")?.value ?? "";

    try {
      messageElement?.classList.add("d-none");

      const response = await loginApi(email, password);

      // Guarda o userId em memória (token vai no cookie HttpOnly)
      setUserId(response.userId);

      // Redireciona para tasks
      window.location.href = "/tasks.html";
    } catch (error) {
      messageElement?.classList.remove("d-none");
      if (messageElement) {
        const apiMessage = error instanceof AxiosError ? error.response?.data?.error : undefined;
        messageElement.innerText = apiMessage ?? "Erro ao fazer login";
      }
    }
  });
}
