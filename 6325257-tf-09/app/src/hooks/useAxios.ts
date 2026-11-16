import { useState, useEffect } from 'react'
import clientApi from '../api/clientApi'
import axios from 'axios'

interface UseAxiosResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (url === null) return

    const controller = new AbortController()

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        })
        setData(response.data)
      } catch (err) {
        if (axios.isCancel(err)) return
        setError('Erro ao carregar os dados.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  const refetch = () => setAttempt(prev => prev + 1)

  return { data, error, isLoading, refetch }
}

export default useAxios
