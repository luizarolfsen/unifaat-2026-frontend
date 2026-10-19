/**
 * Primeira View: em vez de devolver JSON, o controller entrega dados
 * para um template EJS (resources/views/hello.ejs), que monta o HTML.
 *
 * Rota: GET /hello?nome=Luan
 */
export default function HelloWorldController(request, response) {
    // Valor padrão antes, sobrescreve se veio na query
    let nome = "mundo";

    if (request.query.nome) {
        nome = request.query.nome;
    }

    // render: executa a view com os dados, coloca Content-Type text/html e responde
    return response.status(200).render("hello", {
        nome: nome,
        agora: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    });
}
