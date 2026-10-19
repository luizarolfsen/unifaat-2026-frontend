import clientApi from "./_clientApi";
import type { PaginatedResponse, PaginationParams, User } from "../types/api";

export async function userListApi({ page = 1, limit = 10 }: PaginationParams = {}): Promise<PaginatedResponse<User>> {
  const { data } = await clientApi.get<PaginatedResponse<User>>("/users", {
    params: { page, limit, order: "id,DESC" },
  });

  return data;
}
