import { useRef, useState } from "react"
import type { FormEvent } from "react"

type Payload = {
    name: string
    email: string
}

// Campos não controlados: ninguém renderiza durante a digitação; o valor é lido só no envio
export function UncontrolledForm() {
    const nameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const [payload, setPayload] = useState<Payload | null>(null)

    function handleSubmit(event: FormEvent) {
        event.preventDefault()

        const name = nameRef.current?.value.trim() ?? ""
        const email = emailRef.current?.value.trim() ?? ""

        if (name === "") {
            nameRef.current?.focus()
            return
        }

        // Este objeto é o que iria no corpo do POST para o backend
        setPayload({ name, email })
    }

    return (
        <section className="card card-body mb-4">
            <h2 className="h5">4. Dados na ref que vão ao backend (campo não controlado)</h2>

            <form className="d-flex flex-column gap-2" onSubmit={handleSubmit}>
                <input ref={nameRef} className="form-control" placeholder="Nome" defaultValue="" />
                <input ref={emailRef} className="form-control" placeholder="E-mail" defaultValue="" />
                <button className="btn btn-primary align-self-start">Montar o corpo do POST</button>
            </form>

            {payload !== null && <pre className="mt-3 mb-0 bg-light p-2 rounded">{JSON.stringify(payload, null, 2)}</pre>}
        </section>
    )
}
