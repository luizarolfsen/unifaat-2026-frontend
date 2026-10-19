import clientApi from "./_clientApi";
import type { LoginResponse } from "../types/api";

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const { data } = await clientApi.post<LoginResponse>("/api/login", {
    email,
    password,
  });

  return data;
}
