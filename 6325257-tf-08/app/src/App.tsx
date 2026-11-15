import { useState } from 'react'
import type { Task, Filter } from './types'
import { TaskForm } from './TaskForm'
import { TaskList } from './TaskList'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  // valor derivado — sem estado extra
  const pendingCount = tasks.filter(t => !t.isDone).length

  // lista filtrada — também valor derivado
  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.isDone
    if (filter === 'done') return task.isDone
    return true
  })

  function handleAdd(name: string) {
    const newTask: Task = {
      id: Date.now(),
      name,
      isDone: false,
    }
    setTasks(current => [...current, newTask])
  }

  function handleToggle(id: number) {
    setTasks(current =>
      current.map(t => (t.id === id ? { ...t, isDone: !t.isDone } : t))
    )
  }

  function handleDelete(id: number) {
    setTasks(current => current.filter(t => t.id !== id))
  }

  function handleFilter(newFilter: Filter) {
    setFilter(newFilter)
  }

  return (
    <div>
      <h1>To-do</h1>
      <p>{pendingCount} pendente(s)</p>

      <TaskForm onAdd={handleAdd} />

      <div>
        <button onClick={() => handleFilter('all')}>Todas</button>
        <button onClick={() => handleFilter('pending')}>Pendentes</button>
        <button onClick={() => handleFilter('done')}>Feitas</button>
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  )
}
