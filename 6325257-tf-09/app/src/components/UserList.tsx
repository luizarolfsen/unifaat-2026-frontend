import { useState } from 'react'
import useAxios from '../hooks/useAxios'
import type { User, PaginatedResponse } from '../types'

type Props = {
  onSelectUser: (user: User) => void
  selectedUser: User | null
}

function UserList({ onSelectUser, selectedUser }: Props) {
  const [page, setPage] = useState(1)
  const url = `/users?page=${page}&limit=5`

  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(url)

  const handlePrev = () => setPage(prev => prev - 1)
  const handleNext = () => setPage(prev => prev + 1)

  if (isLoading) return <p>Carregando...</p>

  if (error !== null) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    )
  }

  if (data === null) return null

  return (
    <div>
      <ul>
        {data.data.map(user => (
          <li key={user.id}>
            <button
              onClick={() => onSelectUser(user)}
              style={{ fontWeight: selectedUser?.id === user.id ? 'bold' : 'normal' }}
            >
              {user.name} — {user.job_title ?? 'sem cargo'}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handlePrev} disabled={page === 1}>Anterior</button>
      <button onClick={handleNext} disabled={data.next === null}>Próxima</button>
    </div>
  )
}

export default UserList
