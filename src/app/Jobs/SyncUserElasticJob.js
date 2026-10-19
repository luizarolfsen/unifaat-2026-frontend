import { createJob } from '../../utils/job.js'
import UserElasticService from '../Services/UserElasticService.js'

/**
 * Disparado pelos controllers de usuário (create, update, delete).
 * Recebe só o id: o service busca o estado atual no Postgres e espelha no Elastic.
 */
export default createJob({
    name: 'SyncUserElasticJob',
    handle: async (payload) => {
        const { id } = payload

        const result = await UserElasticService.sync(id)

        console.log(`Usuário ${id} sincronizado no Elasticsearch: ${result}`)
    }
})
