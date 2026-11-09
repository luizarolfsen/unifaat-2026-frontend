import { useRef, useState } from "react"
import type { ChangeEvent } from "react"

// O <input type="file"> fica escondido; o botão bonito aciona o clique nativo dele pela ref
export function FilePicker() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState("")

    function handlePick() {
        fileInputRef.current?.click()
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        setFileName(file?.name ?? "")
    }

    return (
        <section className="card card-body mb-4">
            <h2 className="h5">3. Acionar o clique de outro elemento</h2>

            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleChange} />

            <div className="d-flex align-items-center gap-3">
                <button className="btn btn-primary" onClick={handlePick}>Escolher imagem</button>
                <span className="text-muted">{fileName === "" ? "Nenhum arquivo" : fileName}</span>
            </div>
        </section>
    )
}
