/**
 * Event: a unidade de execução do entrypoint websocket (o equivalente do Job do worker).
 * O name é o nome que viaja pelo WebSocket (socket.emit('chat:message', ...)).
 * handle(payload, context): context traz o socket de quem enviou e notify(event, payload),
 * que publica no exchange escolhido ao subir o entrypoint.
 */
export function createEvent({ name, handle }) {
    if (!name || typeof name !== 'string') {
        throw new Error('Event precisa receber um name válido.')
    }

    if (typeof handle !== 'function') {
        throw new Error('Event precisa receber um handle(payload, context) válido.')
    }

    return { name, handle }
}
