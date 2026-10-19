import clientApi from "./_clientApi";

export async function taskDeleteApi(idUser: number, taskId: number): Promise<void> {
  const { data } = await clientApi.delete(`/users/${idUser}/tasks/${taskId}`);

  return data;
}
