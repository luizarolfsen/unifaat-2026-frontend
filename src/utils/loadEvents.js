import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Lê app/Events (e as subpastas, uma por domínio: Chat/, ...) e devolve um mapa: nome do Event → Event.
 * É o equivalente do loadJobs: o entrypoint não conhece nenhum Event; Event novo = arquivo novo na pasta.
 */
export default async function loadEvents(eventsPath) {
    const entries = await fs.readdir(eventsPath, { withFileTypes: true })
    const events = {}

    for (const entry of entries) {
        const fullPath = path.join(eventsPath, entry.name)

        if (entry.isDirectory()) {
            Object.assign(events, await loadEvents(fullPath))
            continue
        }

        if (!entry.name.endsWith('.js')) {
            continue
        }

        const eventModule = await import(pathToFileURL(fullPath).href)
        const event = eventModule.default

        if (!event || typeof event.handle !== 'function') {
            continue
        }

        if (events[event.name]) {
            throw new Error(`Event duplicado: ${event.name} (${fullPath})`)
        }

        events[event.name] = event
    }

    return events
}
