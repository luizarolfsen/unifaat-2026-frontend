import { AxiosError } from "axios";
import clientApi from "./_clientApi";
import type { User, ValidationResult } from "../types/api";

// Precisamos de um usuário dummy para validar, vamos usar o id do JWT decodificado
// Ou podemos criar um endpoint específico de validação
// Por enquanto vamos usar um valor genérico já que o middleware valida pelo cookie

export async function validateTokenApi(): Promise<ValidationResult> {
  try {
    // Faz uma requisição simples para validar o token (que está no cookie)
    // Se o token for inválido/expirado, vai retornar 401
    // Precisamos saber o id do usuário, mas ele tá no cookie...
    // Solução: criar um endpoint que retorna o usuário autenticado atual
    const { data } = await clientApi.get<User>(`/users/me`);

    return { valid: true, data };
  } catch (error) {
    // Se der erro 401, token é inválido
    if (error instanceof AxiosError && error.response?.status === 401) {
      return { valid: false };
    }
    throw error;
  }
}
