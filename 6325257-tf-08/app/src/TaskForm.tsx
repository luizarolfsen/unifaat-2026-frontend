import { useState } from 'react'

type Props = {
  onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState('')

  function handleAdd() {
    if (name.trim() === '') return   // early return: nome vazio não adiciona
    onAdd(name.trim())
    setName('')                       // limpa o campo após adicionar
  }

  return (
    <div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nome da task"
      />
      <button onClick={handleAdd}>Adicionar</button>
    </div>
  )
}
