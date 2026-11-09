import { useState } from "react"
import type { AxiosEvent } from "../hooks/useAxios"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types/api"
import { HookStatePanel } from "./HookStatePanel"
import { EventLog } from "./EventLog"

function wait(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
}

// Valor derivado sem let: a url das tasks depende de quem foi escolhido e do botão de erro
function buildTasksUrl(selectedId: number | null, isBroken: boolean): string | null {
    if (isBroken) return "/rota-que-nao-existe"
    if (selectedId === null) return null

    return `/users/${selectedId}/tasks?page=1&limit=20`
}

const LABELS: Record<AxiosEvent, string> = {
    start: "GET  começou  ",
    abort: "GET  CANCELADO",
    done: "GET  chegou   ",
    error: "GET  falhou   ",
}

// A tela do nosso hook: o useAxios que escrevemos, funcionando e contando o que faz
export function HookLab() {
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [isBroken, setIsBroken] = useState(false)
    const [events, setEvents] = useState<string[]>([])

    // Hook 1: a lista de usuários. Hook 2: as tasks do usuário escolhido (url null = parado)
    const users = useAxios<PaginatedResponse<User>>("/users?page=1&limit=5")

    const tasksUrl = buildTasksUrl(selectedId, isBroken)

    function handleEvent(event: AxiosEvent, url: string) {
        const time = new Date().toLocaleTimeString("pt-BR")
        setEvents(current => [...current, `${time}  ${LABELS[event]}  ${url}`])
    }

    const tasks = useAxios<PaginatedResponse<Task>>(tasksUrl, handleEvent)

    function handleChoose(id: number) {
        setIsBroken(false)
        setSelectedId(id)
    }

    function handleRefetch() {
        tasks.refetch()
    }

    function handleBreak() {
        setIsBroken(true)
    }

    // Troca de usuário 3 vezes seguidas: as duas primeiras requisições ainda estão no ar e são canceladas
    async function handleRush() {
        const list = users.data?.data ?? []
        setIsBroken(false)

        for (const user of list.slice(0, 3)) {
            setSelectedId(user.id)
            await wait(5)
        }
    }

    function handleClear() {
        setEvents([])
    }

    return (
        <div className="d-flex flex-column gap-4">
            <section className="card card-body">
                <h2 className="h5">1. Hook da lista de usuários</h2>
                <HookStatePanel
                    isLoading={users.isLoading}
                    error={users.error}
                    hasData={users.data !== null}
                    count={users.data?.data.length ?? 0}
                />
                <div className="d-flex flex-wrap gap-2 mt-3">
                    {users.data?.data.map(user => (
                        <button key={user.id} className="btn btn-outline-primary btn-sm" onClick={() => handleChoose(user.id)}>
                            {user.name}
                        </button>
                    ))}
                </div>
            </section>

            <section className="card card-body">
                <h2 className="h5">2. Hook das tasks (url: {tasksUrl ?? "null, parado"})</h2>
                <HookStatePanel
                    isLoading={tasks.isLoading}
                    error={tasks.error}
                    hasData={tasks.data !== null}
                    count={tasks.data?.data.length ?? 0}
                />
                <div className="d-flex flex-wrap gap-2 mt-3">
                    <button className="btn btn-secondary btn-sm" onClick={handleRefetch}>refetch()</button>
                    <button className="btn btn-warning btn-sm" onClick={handleRush}>Trocar 3x rápido (AbortController)</button>
                    <button className="btn btn-danger btn-sm" onClick={handleBreak}>Forçar erro</button>
                </div>
            </section>

            <section className="card card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h2 className="h5 mb-0">3. O que o hook contou</h2>
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleClear}>Limpar</button>
                </div>
                <EventLog events={events} />
            </section>
        </div>
    )
}
