type HookStatePanelProps = {
    isLoading: boolean
    error: string
    hasData: boolean
    count: number
}

// Mostra os três estados que o hook entrega. Quando um deles muda, o componente que chamou o hook renderiza de novo
export function HookStatePanel({ isLoading, error, hasData, count }: HookStatePanelProps) {
    const loadingClass = isLoading ? "badge text-bg-warning" : "badge text-bg-secondary"
    const errorClass = error !== "" ? "badge text-bg-danger" : "badge text-bg-secondary"
    const dataClass = hasData ? "badge text-bg-success" : "badge text-bg-secondary"

    return (
        <div className="d-flex flex-wrap gap-3 align-items-center">
            <span>isLoading: <span className={loadingClass}>{String(isLoading)}</span></span>
            <span>error: <span className={errorClass}>{error === "" ? "\"\"" : error}</span></span>
            <span>data: <span className={dataClass}>{hasData ? `${count} task(s)` : "null"}</span></span>
        </div>
    )
}
