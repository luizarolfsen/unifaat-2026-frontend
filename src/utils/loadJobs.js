import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export default async function loadJobs(jobsPath) {
    const files = await fs.readdir(jobsPath)
    const jobs = {}

    for (const file of files) {
        if (!file.endsWith('.js')) {
            continue
        }

        const jobFilePath = path.join(jobsPath, file)
        const jobModule = await import(pathToFileURL(jobFilePath).href)
        const fileName = path.basename(file, '.js')

        let jobName = fileName
        let jobHandler = null

        if (jobModule.default) {
            if (typeof jobModule.default === 'function') {
                jobHandler = jobModule.default
            } else if (typeof jobModule.default === 'object' && typeof jobModule.default.handle === 'function') {
                jobName = jobModule.default.name || fileName
                jobHandler = jobModule.default.handle
            }
        }

        if (!jobHandler) {
            const jobDefinition = Object.values(jobModule).find(value => typeof value === 'object' && typeof value.handle === 'function')

            if (jobDefinition) {
                jobName = jobDefinition.name || fileName
                jobHandler = jobDefinition.handle
            }
        }

        if (!jobHandler) {
            const functionExport = Object.values(jobModule).find(value => typeof value === 'function')
            if (functionExport) {
                jobHandler = functionExport
            }
        }

        if (!jobHandler) {
            continue
        }

        jobs[jobName] = jobHandler
    }

    return jobs
}
