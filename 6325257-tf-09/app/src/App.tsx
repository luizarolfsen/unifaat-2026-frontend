import { useState, useEffect } from 'react'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'
import type { User } from './types'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    if (selectedUser === null) {
      document.title = 'Usuários'
      return
    }
    // O título é atualizado pelo UserTasks quando os dados chegam
  }, [selectedUser])

  return (
    <div>
      <h1>Usuários</h1>
      <UserList onSelectUser={setSelectedUser} selectedUser={selectedUser} />
      {selectedUser !== null && (
        <UserTasks user={selectedUser} onTitleUpdate={(count) => {
          document.title = `${selectedUser.name} · ${count} tasks`
        }} />
      )}
    </div>
  )
}

export default App
