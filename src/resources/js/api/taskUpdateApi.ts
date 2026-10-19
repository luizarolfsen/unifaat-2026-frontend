import clientApi from "./_clientApi";
import type { Task } from "../types/api";

export async function taskUpdateApi(
  idUser: number,
  taskId: number,
  updates: Partial<Pick<Task, "name" | "is_done">>
): Promise<Task> {
  const { data } = await clientApi.put<Task>(`/users/${idUser}/tasks/${taskId}`, updates);

  return data;
}
