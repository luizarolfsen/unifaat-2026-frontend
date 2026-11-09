type EventLogProps = {
    events: string[]
}

// Registro de tudo o que o hook contou (começou, cancelou, chegou...)
export function EventLog({ events }: EventLogProps) {
    if (events.length === 0) {
        return <p className="text-muted mb-0">Nenhum evento ainda. Escolha um usuário.</p>
    }

    return (
        <pre className="bg-dark text-light rounded p-3 mb-0" style={{ maxHeight: 260, overflowY: "auto" }}>
            {events.join("\n")}
        </pre>
    )
}
