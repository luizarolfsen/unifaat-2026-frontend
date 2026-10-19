import UserModel from "../../../Models/UserModel.js";
import UserElasticService from "../../../Services/UserElasticService.js";

/**
 * Busca de usuários em duas etapas.
 *
 * Rota: POST /users/search
 * Body: { "filters": { "city": "paulo", "is_active": true, ... }, "page": 1, "limit": 20 }
 *
 * 1) Elasticsearch: resolve os filtros (texto como LIKE '%valor%', datas por intervalo,
 *    booleano exato) e devolve SÓ os ids.
 * 2) Postgres: WHERE id IN (...) pela chave primária, que é a fonte da verdade.
 */
export default async function SearchUserController(request, response) {
    try {
        const filters = request.body.filters || {};
        const pageRequest = Number(request.body.page) || 1;
        const limitRequest = Number(request.body.limit) || 20;

        const page = (pageRequest < 1) ? 1 : pageRequest;
        const limit = (limitRequest > 100 || limitRequest < 1) ? 20 : limitRequest;

        if (typeof filters !== "object" || Array.isArray(filters)) {
            return response.status(400).json({ error: "filters deve ser um objeto" });
        }

        // Etapa 1: quem aparece (e em que ordem) é decidido pelo Elastic
        let result = null;

        try {
            result = await UserElasticService.searchIds(filters, { page, limit });
        } catch (error) {
            if (error.message.startsWith("Campo de busca inválido")) {
                return response.status(400).json({ error: error.message });
            }

            throw error;
        }

        if (result.ids.length === 0) {
            return response.json({ page: page, limit: limit, total: result.total, data: [] });
        }

        // Etapa 2: o que aparece vem do Postgres, pela chave primária
        const users = await UserModel.findAll({
            where: { id: result.ids },
            attributes: { exclude: ["password"] }
        });

        // O WHERE IN não garante a ordem: reordena pelos ids que vieram do Elastic.
        // Usuário excluído no Postgres e ainda no Elastic simplesmente some daqui.
        const usersById = new Map(users.map((user) => [user.id, user]));

        const data = result.ids
            .map((id) => usersById.get(id))
            .filter((user) => user !== undefined);

        return response.json({
            page: page,
            limit: limit,
            total: result.total,
            data: data
        });
    } catch (error) {
        console.error(error);

        return response.status(500).json({
            error: "Internal server error"
        });
    }
}
