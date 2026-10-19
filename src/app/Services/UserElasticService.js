import elastic from '../../database/connections/elastic.js';
import UserModel from '../Models/UserModel.js';

/**
 * Gerencia a cópia dos usuários no Elasticsearch (índice "users").
 * O Postgres é a fonte da verdade: o Elastic só guarda o que a busca precisa.
 */
const INDEX = 'users';

/** Monta o documento do Elastic a partir do usuário do Postgres (sem senha) */
function toDocument(user) {
    return {
        name: user.name,
        email: user.email,
        job_title: user.job_title,
        bio: user.bio,
        city: user.city,
        state: user.state,
        birth_date: user.birth_date,
        is_active: user.is_active,
        created_at: user.created_at
    };
}

/** Cria ou substitui o documento: PUT /users/_doc/{id} (upsert) */
async function upsert(user) {
    const { data } = await elastic.put(`/${INDEX}/_doc/${user.id}`, toDocument(user));

    return data.result; // "created" ou "updated"
}

/** Remove o documento; 404 não é erro (o objetivo era ele não existir) */
async function remove(id) {
    const { data } = await elastic.delete(`/${INDEX}/_doc/${id}`, {
        validateStatus: (status) => status === 200 || status === 404
    });

    return data.result; // "deleted" ou "not_found"
}

/**
 * Sincroniza um usuário pelo id: lê o estado ATUAL no Postgres e espelha no Elastic.
 * Existe → upsert. Não existe mais → remove. Serve para criar, atualizar e excluir.
 */
async function sync(id) {
    const user = await UserModel.findByPk(id);

    if (!user) {
        return remove(id);
    }

    return upsert(user);
}

/**
 * Carga em lote: indexa vários usuários numa requisição só (POST /_bulk).
 * O corpo é NDJSON: uma linha de ação ({ index: { _id } }) e uma linha de documento,
 * por usuário. "index" também é upsert: rodar de novo só substitui os documentos.
 * refresh=true: os documentos já ficam visíveis para a busca quando a resposta volta.
 */
async function bulkIndex(users) {
    if (users.length === 0) {
        return { indexed: 0, errors: false };
    }

    const lines = [];

    for (const user of users) {
        lines.push(JSON.stringify({ index: { _index: INDEX, _id: String(user.id) } }));
        lines.push(JSON.stringify(toDocument(user)));
    }

    // O _bulk exige uma quebra de linha no final
    const body = lines.join('\n') + '\n';

    const { data } = await elastic.post('/_bulk?refresh=true', body, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    });

    return { indexed: data.items.length, errors: data.errors };
}

/** Campos de texto: buscados como "contém" (LIKE '%valor%') */
const TEXT_FIELDS = ['name', 'email', 'job_title', 'bio', 'city', 'state'];

/** Campos de data: buscados por intervalo { gte, lte } */
const DATE_FIELDS = ['birth_date', 'created_at'];

/** Campos booleanos: buscados pelo valor exato */
const BOOLEAN_FIELDS = ['is_active'];

/** * e ? são curingas do wildcard: o que o usuário digitou é escapado para virar texto */
function escapeWildcard(value) {
    return String(value).replace(/[\\*?]/g, (char) => `\\${char}`);
}

/**
 * Monta a query do Elastic a partir dos filtros do body.
 * Todos os filtros valem juntos (AND), dentro de um bool.filter.
 * Lança erro se vier um campo que não existe no índice.
 */
function buildQuery(filters) {
    const filter = [];

    for (const [field, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }

        if (TEXT_FIELDS.includes(field)) {
            // LIKE '%valor%': *valor* no subcampo .keyword (texto inteiro), sem diferenciar maiúscula
            filter.push({
                wildcard: {
                    [`${field}.keyword`]: {
                        value: `*${escapeWildcard(value)}*`,
                        case_insensitive: true
                    }
                }
            });
            continue;
        }

        if (BOOLEAN_FIELDS.includes(field)) {
            filter.push({ term: { [field]: value === true || value === 'true' } });
            continue;
        }

        if (DATE_FIELDS.includes(field)) {
            // { "gte": "1990-01-01", "lte": "1999-12-31" }: só as pontas que vierem
            filter.push({ range: { [field]: { gte: value.gte, lte: value.lte } } });
            continue;
        }

        throw new Error(`Campo de busca inválido: ${field}`);
    }

    return { bool: { filter: filter } };
}

/**
 * Etapa 1 da busca: o Elastic resolve os filtros e devolve SÓ os ids (_source: false).
 * Os dados completos vêm depois do Postgres, pelo WHERE IN (fonte da verdade).
 */
async function searchIds(filters, { page, limit }) {
    const { data } = await elastic.post(`/${INDEX}/_search`, {
        _source: false,
        from: (page - 1) * limit,
        size: limit,
        track_total_hits: true,
        sort: [{ created_at: 'desc' }],
        query: buildQuery(filters)
    });

    return {
        total: data.hits.total.value,
        ids: data.hits.hits.map((hit) => Number(hit._id))
    };
}

export default {
    INDEX,
    TEXT_FIELDS,
    DATE_FIELDS,
    BOOLEAN_FIELDS,
    toDocument,
    upsert,
    remove,
    sync,
    bulkIndex,
    buildQuery,
    searchIds
};
