import { createJob } from '../../utils/job.js'

export default createJob({
    name: 'ExampleJob',
    handle: async (payload) => {
        const { name } = payload

        console.log(`Enviando e-mail de boas-vindas para o usuário ${name}`)
    }
})