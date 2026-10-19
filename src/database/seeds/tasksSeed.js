const tasks = [
  // Tarefas do usuário 1 (Alice)
  { name: 'Estudar JavaScript', is_done: true, id_user: 1 },
  { name: 'Fazer exercício de array', is_done: true, id_user: 1 },
  { name: 'Revisar DOM', is_done: false, id_user: 1 },
  { name: 'Praticar seletores CSS', is_done: false, id_user: 1 },

  // Tarefas do usuário 2 (Bruno)
  { name: 'Aprender React', is_done: false, id_user: 2 },
  { name: 'Fazer projeto final', is_done: false, id_user: 2 },
  { name: 'Estudar Git', is_done: true, id_user: 2 },

  // Tarefas do usuário 3 (Carla)
  { name: 'Configurar VS Code', is_done: true, id_user: 3 },
  { name: 'Instalar Node.js', is_done: true, id_user: 3 },
  { name: 'Criar repositório', is_done: false, id_user: 3 },

  // Tarefas do usuário 4 (Daniel)
  { name: 'Estudar async/await', is_done: false, id_user: 4 },
  { name: 'Fazer requisição HTTP', is_done: true, id_user: 4 },

  // Tarefas do usuário 5 (Elisa)
  { name: 'Aprender SQL', is_done: false, id_user: 5 },
  { name: 'Criar banco de dados', is_done: false, id_user: 5 },
  { name: 'Fazer backup', is_done: true, id_user: 5 },

  // Tarefas do usuário 6 (Fabio)
  { name: 'Estudar OOP', is_done: true, id_user: 6 },
  { name: 'Implementar classes', is_done: false, id_user: 6 },

  // Tarefas do usuário 7 (Gabriela)
  { name: 'Debugar código', is_done: true, id_user: 7 },
  { name: 'Refatorar projeto antigo', is_done: false, id_user: 7 },
]

export default async function seedTasks(postgres) {
  for (const task of tasks) {
    await postgres.query(
      `INSERT INTO tasks (name, is_done, id_user, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [task.name, task.is_done, task.id_user]
    )
  }
}
