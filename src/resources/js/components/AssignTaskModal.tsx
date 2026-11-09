import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import type { Task, User, UserSearchFilters } from "../types/api"
import { userSearchApi } from "../api/userSearchApi"
import { taskCreateApi } from "../api/taskCreateApi"
import { getErrorMessage } from "../utils/getErrorMessage"
import { UserSearchResults } from "./UserSearchResults"

type SearchField = "name" | "email" | "job_title" | "city" | "state" | "bio"

const FIELDS: { value: SearchField, label: string }[] = [
    { value: "name", label: "Nome" },
    { value: "email", label: "E-mail" },
    { value: "job_title", label: "Cargo" },
    { value: "city", label: "Cidade" },
    { value: "state", label: "UF" },
    { value: "bio", label: "Bio" },
]

type AssignTaskModalProps = {
    isOpen: boolean
    onClose: () => void
    onCreated: (task: Task, user: User) => void
}

export function AssignTaskModal({ isOpen, onClose, onCreated }: AssignTaskModalProps) {
    const [taskName, setTaskName] = useState("")
    const [field, setField] = useState<SearchField>("name")
    const [text, setText] = useState("")
    const [users, setUsers] = useState<User[] | null>(null)
    const [total, setTotal] = useState(0)
    const [selected, setSelected] = useState<User | null>(null)
    const [error, setError] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    // Referências: o campo do HTML (foco) e um dado de bastidor (a última busca enviada ao backend)
    const taskNameRef = useRef<HTMLInputElement>(null)
    const lastSearchRef = useRef("")

    const canCreate = taskName.trim() !== "" && selected !== null && !isCreating

    // Efeito: quando o modal abre (isOpen muda para true) o campo do nome da tarefa recebe o foco
    useEffect(() => {
        if (!isOpen) return

        taskNameRef.current?.focus()
    }, [isOpen])

    function reset() {
        lastSearchRef.current = ""
        setTaskName("")
        setField("name")
        setText("")
        setUsers(null)
        setTotal(0)
        setSelected(null)
        setError("")
    }

    function handleClose() {
        reset()
        onClose()
    }

    // Buscar: botão ou Enter (o campo está num <form>)
    async function handleSearch(event: FormEvent) {
        event.preventDefault()

        if (text.trim() === "") {
            setError("Digite algo para buscar")
            return
        }

        // Mesma busca da última vez: não chama o backend de novo (a ref não renderiza nada)
        const searchKey = `${field}:${text.trim()}`
        if (searchKey === lastSearchRef.current) return
        lastSearchRef.current = searchKey

        const filters: UserSearchFilters = {}
        filters[field] = text.trim()

        setError("")
        setIsSearching(true)

        try {
            const result = await userSearchApi(filters, 1, 10)
            setUsers(result.data)
            setTotal(result.total)
        } catch (error) {
            lastSearchRef.current = ""   // falhou: permite tentar a mesma busca de novo
            setError(getErrorMessage(error, "Erro ao buscar usuários"))
        }

        setIsSearching(false)
    }

    // Escolher: guarda o usuário selecionado
    function handleChoose(user: User) {
        setSelected(user)
    }

    // Criar tarefa: POST /users/{idUser}/tasks para o usuário escolhido
    async function handleCreate() {
        if (selected === null) return
        if (taskName.trim() === "") return

        setError("")
        setIsCreating(true)

        try {
            const created = await taskCreateApi(selected.id, { name: taskName.trim() })
            onCreated(created, selected)
            handleClose()
        } catch (error) {
            setError(getErrorMessage(error, "Erro ao criar a tarefa"))
        }

        setIsCreating(false)
    }

    if (!isOpen) return null

    return (
        <>
            <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
                <div className="modal-dialog modal-lg modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Nova tarefa para outro usuário</h5>
                            <button type="button" className="btn-close" aria-label="Fechar" onClick={handleClose}></button>
                        </div>

                        <div className="modal-body d-flex flex-column gap-3">
                            <div>
                                <label className="form-label">Nome da tarefa</label>
                                <input
                                    ref={taskNameRef}
                                    className="form-control"
                                    value={taskName}
                                    onChange={event => setTaskName(event.target.value)}
                                />
                            </div>

                            <form className="d-flex flex-column gap-2" onSubmit={handleSearch}>
                                <label className="form-label mb-0">Buscar o usuário</label>

                                <div className="input-group">
                                    <select
                                        className="form-select flex-grow-0 w-auto"
                                        value={field}
                                        onChange={event => setField(event.target.value as SearchField)}
                                    >
                                        {FIELDS.map(item => (
                                            <option key={item.value} value={item.value}>{item.label}</option>
                                        ))}
                                    </select>

                                    <input
                                        className="form-control"
                                        placeholder="Digite para buscar..."
                                        value={text}
                                        onChange={event => setText(event.target.value)}
                                    />

                                    <button className="btn btn-primary" type="submit" disabled={isSearching}>
                                        {isSearching ? "Buscando..." : "Buscar"}
                                    </button>
                                </div>
                            </form>

                            <UserSearchResults
                                users={users}
                                total={total}
                                selectedId={selected?.id ?? null}
                                onChoose={handleChoose}
                            />

                            {selected !== null && (
                                <p className="mb-0">
                                    <strong>Atribuir para:</strong> {selected.name} ({selected.email})
                                </p>
                            )}

                            {error !== "" && <div className="alert alert-danger mb-0">{error}</div>}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
                            <button type="button" className="btn btn-primary" disabled={!canCreate} onClick={handleCreate}>
                                {isCreating ? "Criando..." : "Criar tarefa"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal-backdrop fade show"></div>
        </>
    )
}
