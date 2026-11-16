/**
 * Chat em tempo real como View pública (sem login): o HTML vem de resources/views/chat.ejs e o React monta
 * a tela dentro do #root. O nome do participante é digitado na própria tela. O túnel WebSocket NÃO passa
 * por aqui: o navegador abre /socket.io/ e o nginx repassa para o container nodewebsocket.
 *
 * Rota: GET /chat (pública)
 */
export default function ChatViewController(request, response) {
    return response.status(200).render("chat");
}
