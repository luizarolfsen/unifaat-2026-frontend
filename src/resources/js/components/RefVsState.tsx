import { useRef, useState } from "react"

// Estado x referência: os dois sobrevivem às renderizações, mas só o estado renderiza
export function RefVsState() {
    const [count, setCount] = useState(0)
    const [shownRef, setShownRef] = useState(0)
    const clicksRef = useRef(0)

    function handleState() {
        setCount(current => current + 1)
    }

    function handleRef() {
        clicksRef.current += 1
        console.log("clicksRef.current =", clicksRef.current)   // muda, mas a tela não
    }

    // Só para mostrar: copia o valor da ref para um estado, o que provoca a renderização
    function handleShow() {
        setShownRef(clicksRef.current)
    }

    return (
        <section className="card card-body mb-4">
            <h2 className="h5">2. useState x useRef</h2>

            <p className="mb-2">
                Estado: <strong>{count}</strong> · Ref (valor na última renderização): <strong>{shownRef}</strong>
            </p>

            <div className="d-flex gap-2">
                <button className="btn btn-primary" onClick={handleState}>+1 no estado (renderiza)</button>
                <button className="btn btn-warning" onClick={handleRef}>+1 na ref (não renderiza)</button>
                <button className="btn btn-outline-secondary" onClick={handleShow}>Mostrar a ref</button>
            </div>
        </section>
    )
}
