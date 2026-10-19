// Guarda o userId em memória durante a sessão
let currentUserId: number | null = null;

export function setUserId(userId: number): void {
  currentUserId = userId;
}

export function getUserId(): number | null {
  return currentUserId;
}

export function clearUserId(): void {
  currentUserId = null;
}
