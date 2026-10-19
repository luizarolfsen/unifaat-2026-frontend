/**
 * Elementos <li> guardam taskId/userId direto como propriedades
 * customizadas (em vez de data-attributes). Esse tipo só existe
 * para o TypeScript aceitar esse padrão sem usar "any".
 */
export interface TaskListItemElement extends HTMLLIElement {
  taskId: number;
  userId: number;
}

export interface UserListItemElement extends HTMLLIElement {
  userId: number;
}
