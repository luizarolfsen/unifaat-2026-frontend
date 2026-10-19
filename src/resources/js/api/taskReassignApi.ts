import clientApi from "./_clientApi";
import type { Task } from "../types/api";

export async function taskReassignApi(idUser: number, taskId: number, newUserId: number): Promise<Task> {
  const { data } = await clientApi.put<Task>(`/users/${idUser}/tasks/${taskId}`, {
    id_user: newUserId,
  });

  return data;
}
