import type { Task } from './types'

type Props = {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  function handleToggle() {
    onToggle(task.id)
  }

  function handleDelete() {
    onDelete(task.id)
  }

  return (
    <li>
      <span
        onClick={handleToggle}
        style={{ textDecoration: task.isDone ? 'line-through' : 'none', cursor: 'pointer' }}
      >
        {task.name}
      </span>
      <button onClick={handleDelete}>Excluir</button>
    </li>
  )
}
