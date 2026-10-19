import ExampleJob from '../../app/Jobs/ExampleJob.js'

export default {
    name: 'create-example-job',
    description: 'Enfileira o job ExampleJob na fila default',

    async handle() {
        await ExampleJob.dispatch('default', { name: 'luan' });
        console.log('Job ExampleJob enviado para a fila default');
    }
}
