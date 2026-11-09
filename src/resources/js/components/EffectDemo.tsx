import { useEffect, useState } from "react"
import { Clock } from "./Clock"

// Efeito: depois que o estado muda e a tela é desenhada, sincroniza algo de fora (o título da aba)
export function EffectDemo() {
    const [count, setCount] = useState(0)
    const [isClockVisible, setIsClockVisible] = useState(true)

    useEffect(() => {
        document.title = `Cliques: ${count}`
    }, [count])

    function handleCount() {
        setCount(current => current + 1)
    }

    function handleToggleClock() {
        setIsClockVisible(current => !current)
    }

    return (
        <section className="card card-body mb-4">
            <h2 className="h5">5. useEffect: a ação da transição de estados</h2>

            <div className="d-flex align-items-center gap-3 mb-2">
                <button className="btn btn-primary" onClick={handleCount}>+1 (olhe o título da aba)</button>
                <span>Estado: <strong>{count}</strong></span>
            </div>

            <div className="d-flex align-items-center gap-3">
                <button className="btn btn-outline-secondary" onClick={handleToggleClock}>
                    {isClockVisible ? "Desmontar o relógio" : "Montar o relógio"}
                </button>
                {isClockVisible && <Clock />}
            </div>
        </section>
    )
}
