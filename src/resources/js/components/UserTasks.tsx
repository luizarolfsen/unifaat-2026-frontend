import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types/api"

type UserTasksProps = {
    user: User
}

export function UserTasks({ user }: UserTasksProps) {
    // O componente herda os estados do hook: mudou data/error/isLoading, esta função roda de novo
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`
    )

    function handleRetry() {
        refetch()
    }

    if (isLoading) {
        return <p className="text-muted">Carregando as tasks de {user.name}...</p>
    }

    if (error !== "") {
        return (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
                <span>{error}</span>
                <button className="btn btn-sm btn-outline-danger" onClick={handleRetry}>Tentar de novo</button>
            </div>
        )
    }

    if (data === null) return null

    const tasks = data.data

    return (
        <>
            <h2 className="h5">Tasks de {user.name}</h2>

            {tasks.length === 0 && <p className="text-muted">Nenhuma task.</p>}

            <ul className="list-group">
                {tasks.map(task => (
                    <li key={task.id} className="list-group-item d-flex justify-content-between">
                        <span>{task.name}</span>
                        <span className={task.is_done ? "badge text-bg-success" : "badge text-bg-secondary"}>
                            {task.is_done ? "feita" : "pendente"}
                        </span>
                    </li>
                ))}
            </ul>
        </>
    )
}
