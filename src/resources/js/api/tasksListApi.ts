import clientApi from "./_clientApi";
import type { PaginatedResponse, PaginationParams, Task } from "../types/api";

export async function tasksListApi(
  idUser: number,
  { page = 1, limit = 10 }: PaginationParams = {}
): Promise<PaginatedResponse<Task>> {
  const { data } = await clientApi.get<PaginatedResponse<Task>>(`/users/${idUser}/tasks`, {
    params: { page, limit },
  });

  return data;
}
