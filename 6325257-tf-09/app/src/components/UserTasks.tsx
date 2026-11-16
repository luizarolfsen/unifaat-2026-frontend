import { useState, useEffect, useRef } from 'react'
import useAxios from '../hooks/useAxios'
import clientApi from '../api/clientApi'
import type { User, Task, PaginatedResponse } from '../types'

type Props = {
  user: User
  onTitleUpdate: (count: number) => void
}

function UserTasks({ user, onTitleUpdate }: Props) {
  const url = `/users/${user.id}/tasks?page=1&limit=20`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(url)

  const [filterText, setFilterText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filterRef = useRef<HTMLInputElement>(null)
  const responseCountRef = useRef(0)

  // Foco automático ao montar
  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  // Conta respostas recebidas (sem re-render)
  useEffect(() => {
    if (data === null) return
    responseCountRef.current += 1
    onTitleUpdate(data.total)
  }, [data])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value)
  }

  const handleClear = () => {
    setFilterText('')
    filterRef.current?.focus()
  }

  const handleToggleTask = async (task: Task) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      })
      refetch()
    } catch {
      setSaveError('Erro ao salvar. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleShowCount = () => {
    console.log(`Respostas recebidas: ${responseCountRef.current}`)
  }

  if (isLoading) return <p>Carregando tasks...</p>

  if (error !== null) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    )
  }

  if (data === null) return null

  const filteredTasks = data.data.filter(task =>
    task.name.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div>
      <h2>Tasks de {user.name}</h2>

      <div>
        <input
          ref={filterRef}
          type="text"
          placeholder="Filtrar por nome..."
          value={filterText}
          onChange={handleFilterChange}
        />
        <button onClick={handleClear}>Limpar</button>
      </div>

      <button onClick={handleShowCount}>Mostrar</button>

      {isSaving && <p>Salvando...</p>}
      {saveError !== null && <p>{saveError}</p>}

      <ul>
        {filteredTasks.map(task => (
          <li key={task.id} onClick={() => handleToggleTask(task)} style={{ cursor: 'pointer' }}>
            {task.is_done ? '✅' : '⬜'} {task.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UserTasks
