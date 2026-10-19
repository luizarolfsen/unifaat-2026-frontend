import clientApi from "./_clientApi";

export async function userDeleteApi(id: number): Promise<void> {
  const { data } = await clientApi.delete(`/users/${id}`);

  return data;
}
