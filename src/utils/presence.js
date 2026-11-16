import { randomUUID } from 'node:crypto'
import fs from 'node:fs'

const HEARTBEAT_MS = 5000
const EXPIRES_MS = 15000

/** IPv4 "limpo": tira o embrulho IPv4-mapeado (::ffff:1.2.3.4) e troca o ::1 do localhost por 127.0.0.1. */
export function normalizeIp(ip) {
    const value = String(ip ?? '').trim()

    if (value.startsWith('::ffff:')) {
        return value.slice(7)
    }

    if (value === '::1') {
        return '127.0.0.1'
    }

    return value
}

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

/**
 * Gateway da rede do Docker (o computador que roda o Docker, visto de dentro do container): quem conecta
 * DO PRÓPRIO computador chega ao nginx por ele, e o nginx só enxerga esse IP (ex.: 172.18.0.1).
 * Lê a rota padrão do container em /proc/net/route (Linux); fora do Linux devolve null.
 */
function dockerGateway() {
    try {
        const lines = fs.readFileSync('/proc/net/route', 'utf8').split('\n').slice(1)

        for (const line of lines) {
            const [, destination, gateway] = line.split('\t')

            if (destination === '00000000' && gateway) {
                return gateway.match(/../g).reverse().map((hex) => parseInt(hex, 16)).join('.')
            }
        }
    } catch {
        return null
    }

    return null
}

const GATEWAY = dockerGateway()

/**
 * IP de quem conectou. Atrás do nginx, o X-Real-IP (o $remote_addr que o PRÓPRIO nginx viu) é o confiável: o
 * X-Forwarded-For pode vir com um IP inventado pelo client. Sem proxy, vale o endereço do socket.
 * Outro computador da rede: o IP real dele. O próprio computador do Docker chega pelo gateway: nesse caso o
 * IP certo é o do PC na rede, que vem do host digitado no navegador (http://192.168.1.171:8080) ou do
 * HOST_LAN_IP do .env (para quem entra por localhost).
 */
export function ipOf(socket, gateway = GATEWAY) {
    const headers = socket.handshake.headers
    const forwarded = String(headers['x-forwarded-for'] ?? '').split(',')[0]
    const ip = normalizeIp(headers['x-real-ip'] || forwarded || socket.handshake.address)

    if (!gateway || ip !== gateway) {
        return ip
    }

    const host = String(headers.host ?? '').split(':')[0]

    if (IPV4.test(host) && host !== '127.0.0.1') {
        return host
    }

    return process.env.HOST_LAN_IP || ip
}

/**
 * Presença (quem está online) COMPARTILHADA entre as réplicas do websocket.
 * Cada réplica só conhece os sockets dela: então publica a lista local no exchange (presence:instance) e guarda
 * a lista das outras. A lista final é a união de todas. Uma réplica que cai some sozinha: sem batimento por 15 s,
 * a lista dela expira. Quem só distribui eventos continua só distribuindo: aqui é só informação de conexão.
 */
export function createPresence({ io, notify }) {
    const instanceId = randomUUID()
    const byInstance = new Map()
    let lastSent = ''

    const localUsers = () => [...io.sockets.sockets.values()]
        .filter((socket) => socket.data.name)
        .map((socket) => ({ id: socket.id, name: socket.data.name, ip: ipOf(socket) }))

    const list = () => {
        const now = Date.now()
        const users = []

        for (const [id, entry] of byInstance) {
            if (now - entry.seenAt > EXPIRES_MS) {
                byInstance.delete(id)
                continue
            }

            users.push(...entry.users)
        }

        return users
    }

    // Só avisa os clients quando a lista mudou de verdade (o batimento repete a mesma lista)
    const broadcastIfChanged = () => {
        const users = list()
        const json = JSON.stringify(users)

        if (json === lastSent) {
            return
        }

        lastSent = json
        io.emit('presence:list', users)
    }

    const publish = () => notify('presence:instance', { instance: instanceId, users: localUsers() })

    // Chegou a lista de uma réplica (inclusive a nossa, que volta pelo exchange)
    const receive = (payload) => {
        byInstance.set(payload.instance, { users: payload.users, seenAt: Date.now() })
        broadcastIfChanged()
    }

    setInterval(() => {
        publish().catch((error) => console.error('Erro ao publicar a presença:', error))
        broadcastIfChanged()
    }, HEARTBEAT_MS)

    return { publish, receive, list }
}
