import { useEffect, useRef, useState } from "react"
import { isCancel } from "axios"
import clientApi from "../api/_clientApi"
import { getErrorMessage } from "../utils/getErrorMessage"

// O que o hook conta para quem quiser acompanhar: começou, foi cancelado, chegou, falhou
export type AxiosEvent = "start" | "abort" | "done" | "error"

type UseAxiosResult<T> = {
    data: T | null
    error: string
    isLoading: boolean
    refetch: () => void
}

/**
 * Custom hook: GET com Axios + os três estados da requisição.
 *
 * Os estados (data, error, isLoading) nascem AQUI, mas pertencem ao componente
 * que chama o hook: quando o hook chama setData/setError/setIsLoading, quem
 * renderiza de novo é o componente.
 *
 * - url === null: o hook fica parado (ainda não sei o que buscar).
 * - dependências do efeito = [url, attempt], ambas primitivas (nunca objeto
 *   criado no corpo do componente, que seria um endereço novo a cada render).
 * - a limpeza cancela a requisição anterior (AbortController): sem corrida.
 * - onEvent (opcional) avisa cada etapa; fica numa REFERÊNCIA para não entrar nas
 *   dependências do efeito (uma função nova a cada render rodaria o efeito sempre).
 */
export function useAxios<T>(
    url: string | null,
    onEvent?: (event: AxiosEvent, url: string) => void
): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(url !== null)
    const [attempt, setAttempt] = useState(0)
    const onEventRef = useRef(onEvent)

    // Sem dependências: depois de toda renderização a ref passa a apontar para a função mais recente
    useEffect(() => {
        onEventRef.current = onEvent
    })

    useEffect(() => {
        if (url === null) {
            setData(null)
            setIsLoading(false)
            return
        }

        const target = url
        const controller = new AbortController()
        const request = { isPending: true }

        async function load() {
            setIsLoading(true)
            setError("")
            onEventRef.current?.("start", target)

            try {
                const response = await clientApi.get<T>(target, { signal: controller.signal })
                request.isPending = false
                setData(response.data)
                onEventRef.current?.("done", target)
            } catch (err) {
                if (isCancel(err)) return
                request.isPending = false
                setError(getErrorMessage(err, "Erro ao carregar os dados"))
                onEventRef.current?.("error", target)
            }

            setIsLoading(false)
        }

        load()

        // Limpeza: só cancela se a requisição ainda está no ar (abort numa que já terminou não faz nada)
        return () => {
            if (!request.isPending) return

            controller.abort()
            onEventRef.current?.("abort", target)
        }
    }, [url, attempt])

    // Só muda um estado: quem faz o trabalho é o efeito (a transição de estados)
    function refetch() {
        setAttempt(current => current + 1)
    }

    return { data, error, isLoading, refetch }
}
