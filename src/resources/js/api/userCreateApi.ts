import clientApi from "./_clientApi";
import type { User } from "../types/api";

export interface UserCreateRequestBody extends Pick<User, "name" | "email"> {
  password: string;
}

export async function userCreateApi(requestBody: UserCreateRequestBody): Promise<User> {
  const { data } = await clientApi.post<User>("/users", requestBody);

  return data;
}
