export type Task = {
  id: number
  name: string
  isDone: boolean
}

export type Filter = 'all' | 'pending' | 'done'
