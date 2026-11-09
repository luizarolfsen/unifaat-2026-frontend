import { useRef } from "react"

// Referência para elementos do HTML: acionar eventos nativos (focus, scrollIntoView)
export function FocusDemo() {
    const inputRef = useRef<HTMLInputElement>(null)
    const endRef = useRef<HTMLDivElement>(null)

    function handleFocus() {
        inputRef.current?.focus()
    }

    function handleSelect() {
        inputRef.current?.select()
    }

    function handleScroll() {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    return (
        <section className="card card-body mb-4">
            <h2 className="h5">1. Elementos do HTML: focus, select, scrollIntoView</h2>

            <input ref={inputRef} className="form-control mb-2" defaultValue="Texto do campo" />

            <div className="d-flex gap-2 mb-2">
                <button className="btn btn-primary" onClick={handleFocus}>focus()</button>
                <button className="btn btn-secondary" onClick={handleSelect}>select()</button>
                <button className="btn btn-outline-primary" onClick={handleScroll}>scrollIntoView()</button>
            </div>

            <div style={{ height: 120, overflowY: "auto" }} className="border rounded p-2">
                <p style={{ height: 160 }} className="text-muted">Role a caixa ou use o botão...</p>
                <div ref={endRef} className="fw-bold">Fim da caixa (o botão rolou até aqui)</div>
            </div>
        </section>
    )
}
