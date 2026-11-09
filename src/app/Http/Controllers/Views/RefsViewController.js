/**
 * Laboratório de referências (useRef) e efeitos (useEffect) como View pública:
 * sem login, sem middleware. O HTML vem de resources/views/refs.ejs.
 *
 * Rota: GET /refs
 */
export default function RefsViewController(request, response) {
    return response.status(200).render("refs");
}
