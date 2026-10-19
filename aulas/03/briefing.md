Briefing para produção audiovisual e de conteúdo 
Aula Completa
2026.2

Professor: Luan Tavares Lourenço
Disciplina: Frontend

Aula:
1☐ 2☐ 3☒ 4☐ 5☐ 6☐ 7☐ 8☐ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐ 

Título da aula: 

Vite, Forms e Listeners

Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução
A Aula 1 estabeleceu o DOM como árvore de nós e a Vendor API do JS para criar, inserir e selecionar elementos. A Aula 2 aprofundou os seletores (cardinalidade de class e id), aproximou CSS e JS pela mesma linguagem de seleção, e abriu o JS reativo com addEventListener, target e currentTarget. A Aula 3 retoma a comunicação do frontend com o backend: volta ao servidor com API e banco de dados, agora com uma tabela de Usuários e um CRUD completo — por enquanto a API está aberta, sem autenticação, o que fica para a próxima aula, de segurança. Antes de consumir essa API, a aula introduz o Vite como ferramenta de desenvolvimento (HMR e pré-compilação), aprofunda listeners com uma enumeração de eventos e o par preventDefault/stopPropagation, apresenta os principais atributos de formulários HTML e o evento submit, e fecha com o Axios como cliente HTTP para transformar a resposta JSON da API em objeto manipulável — a mesma lógica de parsing já vista desde a Aula 1.

2 - Vite: Hot Module Reload e Pré-compilação

2.1 - O conceito de build
Antes de falar de Vite, cabe fixar o que é um build: o processo que pega o código-fonte como o desenvolvedor escreve (múltiplos arquivos, sintaxes modernas, muitas vezes código que o navegador não entende diretamente) e o transforma no conjunto de arquivos que efetivamente vai para produção — otimizado, empacotado, e compatível com o que o navegador sabe interpretar. É esse processo que entrega, por exemplo, a pré-compilação de TypeScript para JavaScript puro, ou a junção de vários módulos em um só arquivo. Ferramentas que fazem esse trabalho são chamadas de build tools (ou bundlers), e é exatamente nessa categoria que o Vite se encaixa.

2.2 - O que é o Vite
O Vite é uma build tool usada no ambiente de desenvolvimento do frontend, com duas finalidades principais: Hot Module Reload (HMR) e pré-compilação. A pré-compilação é a mais relevante para o curso — é ela que permite escrever código em ferramentas como TypeScript e sintaxes mais modernas (isso será aprofundado na aula de TypeScript e Pré-compilação), enquanto o HMR resolve produtividade no dia a dia de desenvolvimento.

2.3 - Hot Module Reload (HMR)
Sem HMR, qualquer alteração em um arquivo do frontend exige recarregar a página inteira no navegador para ver o resultado — perdendo estado da aplicação (valores digitados em formulário, scroll, estado de componentes). O HMR mantém uma conexão ativa entre o servidor de desenvolvimento do Vite e o navegador; quando um arquivo é salvo, o Vite identifica exatamente qual módulo mudou e envia só essa atualização para o navegador, que substitui o módulo em tempo real, sem recarregar a página inteira e sem perder o estado em memória.

2.4 - Entrypoint: vite.config.js
Toda configuração do Vite — incluindo os parâmetros do HMR — parte de um arquivo de entrada na raiz do projeto, o vite.config.js:

```
import { defineConfig } from 'vite'
export default defineConfig({
    root: 'public',
    server: {
        open: (process.env.IS_CONTAINER !== "TRUE"),
        hmr: true,
        host: true,
        port: 5173
    }
})
```

Vale destacar server.host: true — permite que o servidor aceite conexões vindas de fora do localhost (importante quando o navegador está em outro host/rede), e server.port: 5173, a porta padrão do servidor de HMR.

2.5 - Execução do Vite
O Vite é instalado como dependência do projeto (não como pacote global), então o binário fica dentro de node_modules/.bin. Sem usar alias de npm scripts, o comando de execução é:

```
./node_modules/.bin/vite
```

ou, de forma equivalente, chamando apenas o nome do binário quando já se está dentro do contexto do projeto:

```
vite
```

(esse segundo caso normalmente exige que node_modules/.bin esteja no PATH, o que os npm scripts fazem automaticamente — chamando o binário direto pelo path relativo, como no primeiro exemplo, isso não é necessário).

3 - Listeners: eventos, preventDefault e propagação

3.1 - addEventListener: revisão
Como visto na Aula 2, addEventListener registra uma função callback para reagir a um evento em um elemento, recebendo como parâmetro o objeto event, de onde vêm target (elemento onde o evento ocorreu) e currentTarget (elemento onde o listener foi registrado).

3.2 - Principais eventos
Eventos são valores predefinidos (strings) que o navegador dispara em momentos específicos. Os mais usados no dia a dia de frontend:
- click, dblclick — clique simples e duplo clique
- mouseover, mouseout — o ponteiro entra ou sai de um elemento (propaga para filhos)
- mouseenter, mouseleave — equivalentes que não propagam para filhos
- keydown, keyup — tecla pressionada ou solta
- input — valor de um campo muda a cada digitação
- change — valor de um campo muda e perde o foco (ou select/checkbox muda)
- focus, blur — elemento ganha ou perde foco
- submit — formulário é enviado
- load — recurso (página, imagem, script) termina de carregar
- DOMContentLoaded — o HTML terminou de ser parseado, sem esperar imagens/estilos

```
// sintaxe de registro: elemento.addEventListener(evento, callback)
botao.addEventListener("click", function (event) {
  console.log("cliquei");
});
```

3.3 - preventDefault()
Vários elementos HTML têm um comportamento padrão do navegador associado a um evento — um link navega ao ser clicado, um formulário recarrega a página ao ser enviado. event.preventDefault() cancela esse comportamento padrão, sem impedir que o evento continue se propagando pela árvore.

```
// clique em uma âncora sem navegar / recarregar a página
// Não retorna valor (undefined)
const link = document.querySelector("a.interno");
link.addEventListener("click", function (event) {
  event.preventDefault();
  console.log("navegação padrão cancelada");
});
```

3.4 - stopPropagation() e as fases do evento: capturing e bubbling
Todo evento disparado em um elemento da árvore percorre até três fases: capturing (o evento desce da raiz do documento até o elemento alvo), o próprio target (o evento chega ao elemento onde de fato ocorreu), e bubbling (o evento sobe do elemento alvo de volta até a raiz). Por padrão, addEventListener escuta na fase de bubbling — a mais usada na prática; a fase de capturing só é ativada explicitamente passando { capture: true } como terceiro argumento.
Isso explica o comportamento visto na Aula 2: um clique em um elemento filho também dispara os listeners registrados nos elementos pais para o mesmo evento, porque o evento borbulha (bubbling) por eles. event.stopPropagation() interrompe essa propagação, impedindo que listeners de elementos ancestrais (no caso de bubbling) sejam disparados pelo mesmo evento.

```
// registra o listener na fase de capturing (menos comum)
container.addEventListener("click", handler, { capture: true });
// stopPropagation impede que o evento continue subindo (bubbling)
// Não retorna valor (undefined)
item.addEventListener("click", function (event) {
  event.stopPropagation();
});
```

4 - Forms

4.1 - HTML de formulário e atributos principais
O elemento form agrupa os elementos de entrada de dados. Alguns atributos de input merecem destaque:
- value — o valor atual do campo
- placeholder — texto de exemplo exibido quando o campo está vazio
- disabled — desabilita o campo; ele não é enviado no submit
- readonly — o campo não pode ser editado, mas é enviado no submit
- checked — marca um checkbox ou radio como selecionado
- required — exige preenchimento antes de permitir o submit
- name — identifica o campo dentro do conjunto de dados do formulário
- type — define o tipo de input (text, email, password, checkbox, radio, number, etc.)

```
<form id="form-usuario">
  <input type="text" name="nome" placeholder="Nome" required>
  <input type="email" name="email" value="" required>
  <input type="checkbox" name="ativo" checked>
  <input type="text" name="id" value="123" readonly>
  <button type="submit" disabled>Salvar</button>
</form>
```

4.2 - O evento submit
O listener de submit é registrado no próprio elemento form — que engloba todos os elementos internos —, e não em cada input isoladamente ou no botão de envio. Como o comportamento padrão do navegador ao enviar um formulário é recarregar a página, preventDefault() é praticamente obrigatório aqui quando a intenção é tratar o envio via JS (por exemplo, mandando os dados para a API).

```
// listener registrado no <form>, não no botão
// Não retorna valor (undefined)
const formulario = document.querySelector("#form-usuario");
formulario.addEventListener("submit", function (event) {
  // evita o reload padrão da página
  event.preventDefault();
  const nome = formulario.nome.value;
  const email = formulario.email.value;
  console.log(nome, email);
});
```

5 - Consumindo a API com Axios

5.1 - De JSON para objeto: a mesma lógica de sempre
Desde a Aula 1 essa lógica se repete: HTML, CSS, JS e JSON trafegam pela rede como string, e precisam ser convertidos (parseados) em algo manipulável — objeto, no caso do JSON, DOM, no caso do HTML. Ao consumir a API de Usuários, a resposta chega como texto JSON e precisa virar objeto JS antes de ser usada — isso vale tanto no frontend quanto no próprio backend em Node, que também consome APIs externas da mesma forma.

5.2 - O que é o Axios
Axios é uma lib de cliente HTTP baseada em Promises, usada tanto no frontend quanto no backend (Node) — a mesma API funciona nos dois ambientes. Ele já faz o parsing do JSON de resposta automaticamente, entregando o corpo já como objeto em response.data.

5.3 - Instalação

```
npm install axios
```

5.4 - Exemplo de uso

```
import axios from "axios";
// GET: busca a lista de usuários da API
// response.data já vem parseado como objeto/array
async function buscarUsuarios() {
  const response = await axios.get("http://localhost:3000/usuarios");
  console.log(response.data);
}
// POST: envia um novo usuário para a API
async function criarUsuario() {
  const response = await axios.post("http://localhost:3000/usuarios", {
    nome: "Ana",
    email: "ana@email.com",
  });
  console.log(response.data);
}
```

O mesmo código, com o mesmo import axios from "axios", funciona dentro de um controller do backend Node para consumir outra API — reforçando que Axios não é uma ferramenta exclusiva de frontend.

6 - Conclusão
Esta aula fechou o ciclo de comunicação entre frontend e backend iniciado na Aula 1: o conceito de build justificou a existência do Vite, que entrou como ferramenta de desenvolvimento com HMR poupando reloads completos e pré-compilação abrindo caminho para as aulas seguintes, configurado a partir de um entrypoint (vite.config.js) e executado diretamente pelo binário em node_modules/.bin. Os listeners ganharam profundidade com a enumeração dos principais eventos e o par preventDefault/stopPropagation, este último explicado pelas fases de capturing e bubbling do evento. Os formulários trouxeram os atributos que controlam entrada de dados — value, disabled, readonly, checked, required — e o evento submit, registrado no form e não no botão. Por fim, o Axios encerrou a aula como o cliente HTTP que materializa, na prática, a mesma lógica de conversão de JSON em objeto vista desde a primeira aula — tanto no frontend quanto no backend.

7 - Referências
Vite — Guia oficial (Getting Started, HMR, Config).
MDN — EventTarget.addEventListener(), Event.preventDefault(), Event.stopPropagation().
MDN — Event bubbling e capturing (Introduction to events).
MDN — The HTML form element, atributos de input.
Axios — documentação oficial (axios-http.com).

Questões do TA:


QUESTÃO 1 

Sobre o conceito de build e a finalidade do Vite no ambiente de desenvolvimento do frontend, é correto afirmar que:

A) Build é o processo de leitura de arquivos estáticos pelo Nginx, sem relação com transformação de código.

B) O HMR do Vite recarrega a página inteira a cada alteração salva, sendo equivalente a um F5 automático.

C) Build é o processo que transforma o código-fonte em arquivos prontos para o navegador, e o Vite, como build tool, oferece Hot Module Reload (atualiza só o módulo alterado, sem recarregar a página) além de pré-compilação, sua finalidade mais relevante no curso.

D) O Vite substitui o navegador, executando o JavaScript diretamente no servidor sem necessidade de DOM.

E) A pré-compilação do Vite é opcional e só existe para projetos que não usam TypeScript.


Gabarito: C)

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2 

Sobre as fases de propagação de um evento no DOM e o método stopPropagation(), é correto afirmar que:

A) Um evento sempre ocorre em uma única fase, e stopPropagation() não tem efeito algum sobre listeners de elementos ancestrais.

B) Um evento pode percorrer até três fases — capturing, target e bubbling —; por padrão addEventListener escuta na fase de bubbling, e stopPropagation() interrompe a propagação, impedindo que listeners de ancestrais sejam disparados pelo mesmo evento.

C) A fase de capturing é a mais usada na prática e não pode ser desativada.

D) stopPropagation() cancela o comportamento padrão do navegador para o evento, substituindo a função de preventDefault().

E) Bubbling significa que o evento é disparado simultaneamente em todos os elementos da árvore, sem ordem definida.


Gabarito: B)

Misturar as alternativas? (x ) Sim (  ) Não


QUESTÃO 3 

Sobre o registro do listener de submit em um formulário HTML, é correto afirmar que:

A) O listener deve ser registrado no botão de envio (button type="submit"), nunca no elemento form.

B) O evento submit é disparado automaticamente mesmo sem um botão do tipo submit dentro do form, mas o listener correto é registrado no elemento form, que engloba os campos internos; preventDefault() evita o reload padrão da página ao enviar.

C) preventDefault() dentro do listener de submit impede que os valores dos campos sejam lidos via JS.

D) Campos com o atributo disabled são enviados normalmente no submit, junto com os demais.

E) O atributo readonly impede que o campo seja enviado no submit, assim como disabled.


Gabarito: B)

Misturar as alternativas? (x ) Sim (  ) Não
