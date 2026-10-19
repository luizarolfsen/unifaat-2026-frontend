import { configDotenv } from 'dotenv';
import axios from 'axios';

/**
 * Conexão com o Elasticsearch: é só um cliente HTTP (a API do Elastic é REST + JSON).
 * O host/porta vêm do docker-compose (elasticsearch_host:9200, só na rede interna).
 */
export default (() => {
    configDotenv({
        quiet: true
    });

    const host = process.env.ELASTIC_HOST || 'elasticsearch_host';
    const port = process.env.ELASTIC_PORT || '9200';

    return axios.create({
        baseURL: `http://${host}:${port}`,
        headers: { 'Content-Type': 'application/json' }
    });
})();
