import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client entra na sala e diz o nome (chat:join), logo depois de o túnel abrir.
 * O nome fica no próprio socket (socket.data), a presença é publicada para as outras réplicas e a sala é avisada (chat:joined).
 */
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)

        if (!name) {
            return
        }

        context.socket.data.name = name

        await context.presence.publish()

        // "fulano entrou na sala": vai pelo exchange, então chega a quem está em qualquer réplica
        await context.notify('chat:joined', { name, sentAt: Date.now() })
    }
})
