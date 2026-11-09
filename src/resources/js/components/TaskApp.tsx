import { useEffect, useRef, useState } from "react"
import type { Task, User } from "../types/api"
import { taskCreateApi } from "../api/taskCreateApi"
import { taskUpdateApi } from "../api/taskUpdateApi"
import { taskDeleteApi } from "../api/taskDeleteApi"
import { TaskItem } from "./TaskItem"
import { Page } from "./Page"
import { Alert } from "./Alert"
import { AssignTaskModal } from "./AssignTaskModal"

type TaskAppProps = {
    idUser: number
    userName: string
    initialTasks: Task[]
}

export function TaskApp({ idUser, userName, initialTasks }: TaskAppProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [name, setName] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [message, setMessage] = useState("")

    // Referência para o <input> do HTML: o React coloca o elemento em .current depois de montar
    const nameInputRef = useRef<HTMLInputElement>(null)

    const pending = tasks.filter(task => !task.is_done).length

    // Efeito: depois da primeira renderização, o campo já nasce com o foco
    useEffect(() => {
        nameInputRef.current?.focus()
    }, [])

    // C: create
    async function create() {
        if (name.trim() === "") {
            nameInputRef.current?.focus()
            return
        }

        const created = await taskCreateApi(idUser, { name })
        setTasks(current => [...current, created])
        setName("")
        nameInputRef.current?.focus()
    }

    // U: update (marcar/desmarcar como feita)
    async function toggle(task: Task) {
        const updated = await taskUpdateApi(idUser, task.id, { is_done: !task.is_done })
        setTasks(current => current.map(item => {
            if (item.id !== updated.id) return item
            return updated
        }))
    }

    // D: delete
    async function remove(id: number) {
        await taskDeleteApi(idUser, id)
        setTasks(current => current.filter(task => task.id !== id))
    }

    // TF07: a task foi criada para outro usuário (ou para mim mesmo)
    function handleAssigned(created: Task, user: User) {
        // Só entra na lista se a task é minha: se foi para outra pessoa, a lista dela não é esta
        if (user.id === idUser) setTasks(current => [...current, created])

        setMessage(`Tarefa criada para ${user.name}`)
    }

    return (
        <>
            <Page userName={userName} active="tasks">
                <section>
                    {message !== "" && <Alert variant="success" message={message} onClose={() => setMessage("")} />}

                    <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-outline-primary" onClick={() => setIsModalOpen(true)}>
                            Nova tarefa para outro usuário
                        </button>
                    </div>

                    <div className="input-group mb-3">
                        <input
                            ref={nameInputRef}
                            className="form-control"
                            value={name}
                            onChange={event => setName(event.target.value)}
                        />
                        <button className="btn btn-primary" onClick={create}>Adicionar</button>
                    </div>

                    <p>{pending} pendente(s)</p>

                    <ul className="list-group">
                        {tasks.map(task => (
                            <TaskItem key={task.id} task={task} onToggle={toggle} onDelete={remove} />
                        ))}
                    </ul>
                </section>
            </Page>

            <AssignTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreated={handleAssigned}
            />
        </>
    )
}
