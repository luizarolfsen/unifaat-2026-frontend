import { useEffect, useState } from "react"

// Efeito com limpeza: o timer nasce ao montar e é cancelado ao desmontar
export function Clock() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timerId = window.setInterval(() => setNow(new Date()), 1000)

        return () => window.clearInterval(timerId)
    }, [])

    return <strong>{now.toLocaleTimeString("pt-BR")}</strong>
}
