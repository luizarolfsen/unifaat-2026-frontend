import clientApi from "./_clientApi";
import type { Task } from "../types/api";

export async function taskCreateApi(idUser: number, task: Pick<Task, "name">): Promise<Task> {
  const { data } = await clientApi.post<Task>(`/users/${idUser}/tasks`, task);

  return data;
}
