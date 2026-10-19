import { Command } from 'commander'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import loadJobs from './utils/loadJobs.js'
import rabbit from './database/connections/rabbit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const program = new Command()

program
    .name('worker')
    .description('Worker RabbitMQ')
    .option('--queue <queue>', 'Nome da fila RabbitMQ')
    .parse(process.argv)

const options = program.opts()
const queue = options.queue || 'default'

const jobsPath = path.join(__dirname, 'app', 'Jobs')
const jobs = await loadJobs(jobsPath)

if (Object.keys(jobs).length === 0) {
    console.warn('Atenção: nenhum job registrado em app/Jobs')
}

process.on('SIGINT', async () => {
    console.log('\nEncerrando worker...')
    await rabbit.close()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    console.log('\nEncerrando worker...')
    await rabbit.close()
    process.exit(0)
})

await rabbit.connect()

console.log(`Worker iniciado. Aguardando mensagens na fila: ${queue}`)

await rabbit.consume(queue, async (msg) => {
    if (!msg) {
        return
    }

    let payload = null
    let jobName = null

    try {
        const content = msg.content.toString()
        const data = JSON.parse(content)
        jobName = data.job
        payload = data.payload
    } catch (error) {
        console.error('Falha ao ler mensagem:', error)
        return
    }

    if (!jobName || !jobs[jobName]) {
        console.error(`Job não encontrado: ${jobName}`)
        return
    }

    try {
        await jobs[jobName](payload)
        console.log(`Job executado: ${jobName}`)
    } catch (error) {
        console.error(`Erro ao executar job ${jobName}:`, error)
    }
})
