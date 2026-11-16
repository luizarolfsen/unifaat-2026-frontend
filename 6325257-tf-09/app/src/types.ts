export interface User {
  id: number
  name: string
  email: string
  job_title: string | null
}

export interface Task {
  id: number
  name: string
  is_done: boolean
  id_user: number
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  next: number | null
}

