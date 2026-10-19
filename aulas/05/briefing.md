


Briefing para produção audiovisual e de conteúdo 
Aula Completa
2026.2



Professor: Luan Tavares Lourenço
Disciplina: Frontend


Aula:
1☐ 2☐ 3☐ 4☐ 5☒ 6☐ 7☐ 8☐ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐ 


Título da aula: 

Pré Compiladores e Typescript


Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução
O frontend começou esta disciplina como um arquivo HTML com JavaScript solto — HTML gerado à mão, JS inline, sem nenhuma ferramenta de construção. Ao longo das aulas, caminhou em duas frentes: (1) a estrutura — mudou de HTML puro para componentes, depois para Vite, trazendo Hot Module Replacement; (2) a comunicação — passou a falar com o backend via Axios, a se autenticar via JWT em cookies, e a respeitar CORS.

Esta aula marca o momento em que essas duas frentes convergem. Na estrutura, o projeto deixa de ser JavaScript puro e abraça TypeScript — não apenas como tipagem, mas como ferramenta essencial para organizar e escalar. Com TypeScript, cada função tem contrato explícito: que tipos recebe, que tipo retorna, quais propriedades um objeto possui. Isso que parecia "detalhe" em projetos pequenos (um desenvolvedor, 50 linhas de código) vira o diferencial em projetos reais: múltiplos desenvolvedores, milhares de linhas, mudanças frequentes. Tipos funcionam como documentação executável — o código é sua própria verdade sobre o que pode e o que não pode acontecer. A partir desta aula, todo código novo será escrito em .ts (TypeScript), compilado automaticamente para .js (JavaScript puro) que o navegador entenda. Estrutura clara: arquivos fonte em uma pasta resources/, compilados pelo Vite para JavaScript puro em uma pasta public/, pronto para o navegador.

O Vite aqui não é mais apenas um servidor com HMR — é agora um pré compilador profissional. Ele compila TypeScript e aplica otimizações como minificação e bundling. Minificação reduz o tamanho dos arquivos (removendo espaços, renomeando variáveis longas), enquanto bundling agrupa múltiplos arquivos em poucos bundles, reduzindo requisições HTTP. Veremos dois modos do Vite: modo desenvolvimento (watcher contínuo, recompilação a cada salvamento) e modo produção (build pontual, otimização final).

Na comunicação, consolidamos o JWT guardado em cookies, mas dessa vez usando as informações que já estão no token para eliminar redundância da API — se o backend sabe quem é o usuário pelo JWT, por que o frontend ainda passa o ID na URL? Essa é a API Contextual: o backend lê do token, não do cliente.
2 - O Navegador Só Entende JavaScript Puro
2.1 - A Vendor API: O que o Navegador Aceita
O navegador, qualquer navegador moderno, só entende JavaScript puro — o JavaScript que a especificação ECMAScript define. Tudo que interagimos no frontend (DOM, eventos, requisições, storage) é fornecido pelo navegador através da Vendor API (Application Programming Interface específica do navegador):

// O navegador expõe a Vendor API através do objeto window
window.document                    // Vendor API: DOM
window.addEventListener            // Vendor API: Eventos
window.fetch                       // Vendor API: Requisições HTTP
window.localStorage                // Vendor API: Armazenamento
window.console                     // Vendor API: Logs

// Tudo isso é JavaScript puro, que o navegador entende nativamente
document.querySelector(".card");
const response = await fetch("/api/users");
localStorage.setItem("tema", "escuro");

Aqui mora a verdade fundamental: o navegador não compila, não interpreta, não entende nada além de JavaScript puro. Ele não compila TypeScript. Não interpreta nenhum formato que não seja JS. Ele simplesmente recebe um arquivo .js e o executa contra a Vendor API. Se você enviar um arquivo .ts direto, o navegador lança um erro de sintaxe — porque .ts não é JavaScript válido para o navegador. Mesma coisa: o Node (ambiente backend) também só entende JavaScript puro. TypeScript precisa ser compilado para .js antes de rodar, seja no navegador, seja no servidor.
2.2 - TypeScript e Outros Formatos: O Problema
TypeScript não é JavaScript. Sass não é CSS válido. O navegador não entende nenhum deles. Se você tentar enviar um arquivo .ts para o navegador, ele quebra:

// arquivo: calcular.ts — enviado direto para o navegador
function calcular(valor: number): number {
  return valor + 10;
}

// ✗ SyntaxError: Unexpected token ':' — navegador não entende o ':' after 'valor'

O mesmo acontece com qualquer formato diferente de JS puro. O navegador (e o Node) só falam uma língua: JavaScript puro.
2.3 - Compilação e Transpilação: Conceitos
Para resolver isso, dois processos transformam código expressivo em JavaScript puro:

**Transpilação** — traduzir uma versão de linguagem para outra da mesma "geração":
- ES6+ → ES5 (deixar código moderno compatível com navegadores antigos)
- TypeScript → JavaScript (remover tipos, deixar JS puro)

**Compilação** — transformar código de uma linguagem para outra, geralmente mais baixo nível:
- Sass → CSS (variáveis, nesting se tornam CSS puro)
- TypeScript → JavaScript (pode envolver transformações maiores)

Na prática, os dois termos se misturam. O importante é: código em formato X → JavaScript puro, enviado para o navegador (ou para Node).
2.4 - JavaScript é Dinamicamente Tipado: O Problema da Redundância
JavaScript puro é uma linguagem dinamicamente tipada — o tipo de uma variável pode mudar em tempo de execução, e só se descobre erros de tipo quando o código roda. Isso significa que uma função pode receber um string quando deveria receber um number, sem nenhum aviso.
// JavaScript puro — válido em tempo de escrita, erro em tempo de execução
function calcular(valor) {
  return valor + 10;
}

console.log(calcular(5));      // ✓ 15
console.log(calcular("hello")); // ✓ "hello10" (concatenação, não soma!)

// oops — erro em runtime
const config = {};
console.log(config.database.name);  // TypeError: Cannot read property 'name' of undefined

Em projetos pequenos, isso é tolerável. Com duzentas páginas, cem componentes e dez pessoas escrevendo, o contrato mental não escala.
2.5 - TypeScript: Descobrir Erros Antes de Enviar ao Navegador
TypeScript é um superset de JavaScript — todo código JS válido é automaticamente TS válido — que adiciona a capacidade de declarar tipos. Um arquivo .ts é transpilado para .js puro antes de chegar ao navegador, e é durante essa transpilação que erros de tipo são descobertos (sem rodar o código):

// arquivo: calcular.ts — escrito em TypeScript
function calcular(valor: number): number {
  return valor + 10;
}

console.log(calcular(5));       // ✓ OK
console.log(calcular("hello")); // ✗ Erro em tempo de transpilação: string não é number

↓ (transpilado para)

// calcular.js — enviado ao navegador (TypeScript removido)
function calcular(valor) {
  return valor + 10;
}

console.log(calcular(5));
console.log(calcular("hello"));

Isso permite descobrir erros (e refatorações quebradas) sem enviar código ruim ao navegador. A transpilação é invisível para o desenvolvedor: o Vite faz isso automaticamente enquanto você desenvolve, reportando erros direto no console. A produção só recebe o .js puro e otimizado.
2.4 - Extensão de TypeScript: .ts
Arquivos TypeScript usam a extensão .ts. Exemplo: userListApi.ts, calcular.ts, types.ts, App.ts. Contém funções, tipos, lógica — tudo TypeScript.

// userListApi.ts — TypeScript puro
export async function userListApi(): Promise<Usuario[]> {
  const response = await clientApi.get<Usuario[]>("/users");
  return response.data;
}

// calcular.ts — TypeScript puro
function calcular(valor: number): number {
  return valor + 10;
}

O Vite reconhece a extensão .ts e a transpila para .js, removendo types e deixando JavaScript puro pronto para o navegador (ou Node).
2.5 - Tipos Básicos em TypeScript: A Importância de Tipar para Escalar
Quando um projeto é pequeno (um desenvolvedor, 50 linhas), JavaScript solto funciona. Mas quando cresce (10 desenvolvedores, 10 mil linhas, mudanças frequentes), a falta de tipos vira caos: cada pessoa assume um contrato mental diferente, refatorações quebram código que "deveria" funcionar, debugging vira um inferno. TypeScript força explicitação: cada função declara seu contrato — que tipo recebe, que tipo retorna, quais propriedades um objeto tem. Isso não é burocracia: é organização pura. É a diferença entre saber exatamente o que cada pedaço de código faz e adivinhar.

Os tipos mais comuns cobrem os tipos primitivos do JS:
// Tipos primitivos
let nome: string = "Ana";
let idade: number = 25;
let ativo: boolean = true;

// Arrays
let tags: string[] = ["frontend", "typescript"];
let numeros: Array<number> = [1, 2, 3];

// Union: pode ser string OU number
let id: string | number = 42;
id = "uuid-abc123"; // também OK

// Type aliases: nomear um tipo complexo
type Usuario = {
  id: number;
  nome: string;
  email: string;
};

const user: Usuario = { id: 1, nome: "Ana", email: "ana@example.com" };

// Enum: constantes com nomes significativos
enum StatusPedido {
  Pendente,
  Confirmado,
  Enviado,
  Entregue
}

let status: StatusPedido = StatusPedido.Confirmado;
3 - Generics: Código Reutilizável, Type-Safe e Escalável
3.1 - O Problema: Duplicar Código para Cada Tipo
Suponha uma função que receba um valor e o retorne:
// sem generics, precisa duplicar a função para cada tipo
function wrapString(valor: string): string {
  return valor;
}

function wrapNumber(valor: number): number {
  return valor;
}

function wrapBoolean(valor: boolean): boolean {
  return valor;
}
O padrão é óbvio e repetitivo. Generics resolvem exatamente isso: permitir que uma função (ou classe, ou type) funcione com qualquer tipo, mas mantenha segurança de tipos.
3.2 - Introduzindo Generics com <T>
O símbolo <T> (T de "Type") é um espaço reservado para um tipo que será definido depois. Quando a função é chamada, o TypeScript infere qual tipo T deve ser:
// com generics, uma função funciona para qualquer tipo
function wrap<T>(valor: T): T {
  return valor;
}

// TypeScript infere T = string
wrap("hello");      // retorna: string

// TypeScript infere T = number
wrap(42);           // retorna: number

// TypeScript infere T = boolean
wrap(true);         // retorna: boolean

// Explícito: especificar <T> manualmente
wrap<string>("hello");
A função wrap é idêntica para todos os tipos — o TypeScript apenas ajusta T para cada chamada, oferecendo type-checking completo sem duplicação de código.
3.3 - Generics com Constraints: Limitar os Tipos Aceitos
Às vezes é preciso garantir que T seja de um certo tipo. Constraints fazem isso:
// T deve ser um objeto com propriedade 'id: number'
function getId<T extends { id: number }>(obj: T): number {
  return obj.id;
}

getId({ id: 1, nome: "Ana" });      // ✓ OK
getId({ id: 2, email: "hi@ex.com" }); // ✓ OK
getId("hello");                      // ✗ Erro: string não tem propriedade 'id'

// T deve estender string ou number
function processar<T extends string | number>(valor: T): T {
  // agora você sabe que valor é string ou number
  return valor;
}
3.4 - Generics com Axios e API Responses
Generics brilham ao tipificar respostas de API. Axios retorna um objeto com propriedade data — o tipo de data pode variar (array de usuários, um token, etc). Generics permitem tipar isso:
// Type genérico para resposta de API
type ApiResponse<T> = {
  data: T;
  status: number;
  statusText: string;
};

// Funções de API agora usam generics para tipar a resposta
async function userListApi(): Promise<ApiResponse<Usuario[]>> {
  const response = await clientApi.get("/users");
  return response.data;
}

async function loginApi(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
  const response = await clientApi.post("/login", { email, password });
  return response.data;
}

// Ou, mais comum, tipificar direto com Axios generics
async function userListApi(): Promise<Usuario[]> {
  const response = await clientApi.get<Usuario[]>("/users");
  return response.data;
}

// Se não souber o tipo da resposta, use <any> ou <unknown> (menos type-safe)
const response = await clientApi.get<any>("/endpoint-dinamico");
O <T> em clientApi.get<T>() diz ao TypeScript: "a propriedade data dessa resposta será do tipo T".
3.5 - Generics com Arrays e Objetos
// Array genérico: lista de qualquer tipo
type Lista<T> = T[];

const numeros: Lista<number> = [1, 2, 3];
const strings: Lista<string> = ["a", "b", "c"];

// Objeto com chaves genéricas
type Dicionario<T> = {
  [chave: string]: T;
};

const config: Dicionario<string> = {
  tema: "escuro",
  idioma: "pt-BR"
};

const ids: Dicionario<number> = {
  usuario: 42,
  pedido: 7
};

// Função que inverte um array
function reverter<T>(lista: T[]): T[] {
  return lista.reverse();
}

reverter([1, 2, 3]);                 // [3, 2, 1]
reverter(["a", "b", "c"]);           // ["c", "b", "a"]
reverter([true, false]);             // [false, true]
4 - Pré Compiladores: Conceito e O Vite como Entry Point
4.1 - O que é um Pré Compilador
Um pré compilador (ou transpilador) é um programa que transforma código escrito em uma linguagem mais expressiva (TypeScript, JSX, Sass) em código que o navegador entenda nativamente (JavaScript puro, CSS puro). Exemplos:
- TypeScript → JavaScript (transpilação: remover tipos)
- JSX → JavaScript (transpilação: <Comp/> → React.createElement())
- Sass → CSS (transpilação: variáveis, nesting em CSS puro)
- CoffeeScript → JavaScript (transpilação: sintaxe CoffeeScript em JS)

O navegador não entende nenhum desses formatos — ele só entende JavaScript puro e CSS puro. Por isso, antes de enviar o código para produção (ou ao desenvolvedor durante o desenvolvimento), precisa-se transpilá-lo. Um pré compilador automatiza exatamente isso, tornando invisível para o desenvolvedor.
4.2 - As Duas Serventias do Vite: HMR e Pré Compilação
O Vite tem duas responsabilidades, frequentemente confundidas:

Primeira serventia — HMR (Hot Module Replacement): Apresentado na aula anterior, permite que alterações em arquivos sejam refletidas no navegador instantaneamente, sem recarregar a página inteira. Isso é conforto durante desenvolvimento.

Segunda serventia — Pré Compilação: É a verdadeira potência. O Vite transforma TypeScript em JavaScript/CSS puro, de forma automática e invisível. No desenvolvimento, ele compila em memória. Em produção, roda npm run build e gera arquivos finais minificados, otimizados e prontos para deploy.

4.2.1 - Do node_modules para o Navegador: Tudo Compilado
Até agora, as libs (Axios, Bootstrap, fontes, etc) eram baixadas da internet e carregadas direto no navegador no arquivo HTML. Agora, com pré compilação:

Você faz npm install — as libs ficam em node_modules/ (Axios, Bootstrap, fontes, etc)
Você as importa no seu código TypeScript: import axios from 'axios', import 'bootstrap/css/bootstrap.css'
O Vite as detecta, compila junto com seu código, e as inclui no bundle final
O navegador recebe tudo pré-compilado e otimizado em um bundle único

Exemplo prático:
// Antes (direto no HTML)
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.css">
<script src="https://cdn.jsdelivr.net/npm/axios@1/dist/axios.min.js"></script>

// Agora (no TypeScript)
import axios from 'axios'
import 'bootstrap/css/bootstrap.css'
import 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700'

Benefícios:
- Tudo vem compilado e otimizado pelo Vite, não pelo CDN
- Versionamento explícito no package.json, não na URL do CDN
- CSS é pré processado junto com o seu
- Fontes são incluídas no bundle, não requisições HTTP extras
- Zero mudanças no navegador: ele recebe tudo como JS/CSS puro

Exemplo prático:
desenvolvedor escreve: App.tsx (TypeScript + JSX)
          ↓
      Vite compila
          ↓
navegador recebe: App.js (JavaScript puro)
          ↓
 navegador executa contra Vendor API

A compilação é tão invisível que muitos desenvolvedores não percebem que acontece — é só salvar um .ts, e o navegador já vê atualizado via HMR.
4.3 - Estrutura de Pastas: resources/ → public/
A partir desta aula, o projeto frontend tem uma estrutura clara de entrada e saída:

**resources/** — pasta de origem (source), onde ficam todos os arquivos .ts, .tsx, assets e index.html. O Vite procura aqui.

**public/** — pasta de destino, onde o Vite coloca o JavaScript compilado e otimizado. O navegador lê daqui.

Durante desenvolvimento, o Vite cria um servidor em memória que serve os arquivos compilados instantaneamente. Em produção, roda npm run build e popula de verdade a pasta public/.

4.4 - Minificação e Bundling
O Vite aplica duas otimizações importantes em produção:

**Minificação** — remove espaços em branco, comentários, renomeia variáveis longas para nomes curtos (console.log vira c). Exemplo: um arquivo de 50KB vira 15KB minificado.

**Bundling** — agrupa múltiplos arquivos .js em poucos bundles (ex.: main.js, vendor.js). Em vez de 50 requisições HTTP (uma por arquivo), o navegador faz 2-3. Isso reduz latência de rede dramaticamente.

O Vite faz isso automaticamente em produção — npm run build. Em desenvolvimento, deixa o código legível e não minifica (para debug mais fácil).
4.5 - Comandos do Vite: Watcher vs Build
O Vite oferece dois modos de compilação:

**npm run dev** — inicia o servidor de desenvolvimento com watcher contínuo. O Vite fica "observando" (watching) a pasta resources/. Toda vez que você salva um arquivo .ts ou .tsx, o Vite:
1. Compila aquele arquivo
2. Notifica o navegador via WebSocket (HMR)
3. O navegador recarrega apenas o módulo alterado (não a página inteira)

Isso é o "watcher": um processo que não termina, fica escutando mudanças. Útil durante desenvolvimento.

**npm run build** — compilação pontual, única. O Vite lê todos os arquivos em resources/, compila, minifica, bundla, e salva em public/. Depois termina. Útil em produção e em CI/CD.

Conceito do Watcher: em vez de você rodar manualmente npm run build toda vez que muda um arquivo, o watcher faz isso automaticamente. É como um "observador" que fica de olho. Economia de tempo e menos erros de esquecer de recompilar.
4.6 - Entry Points e Containerização
O Vite, na configuração atual, é um entry point do projeto — ele é um processo separado que sobe na porta 5173 (durante desenvolvimento) ou que faz o build final (em produção). A configuração atual do vite.config.js está estruturada para isso:
// vite.config.js
import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
    root: 'resources',
    server: {
        open: (process.env.IS_CONTAINER !== "TRUE"),
        hmr: true,
        host: true,
        port: 5173
    },
    resolve: {
        alias: {
            '@fa': path.resolve(__dirname, 'node_modules/@fortawesome/fontawesome-free')
        },
    },
    build: {
        outDir: '../public',
        emptyOutDir: true,
        manifest: true,
        rollupOptions: {
            input: [
                "./resources/index.html"
            ],
            output: {
                assetFileNames: 'src/[name].[hash][extname]',
                entryFileNames: 'src/[name].[hash].js',
                chunkFileNames: 'src/[name].[hash].js',
            }
        }
    }
})

Detalhes importantes:
- root: 'resources' — o Vite procura por index.html e assets a partir de resources/;
- server.open — se IS_CONTAINER !== "TRUE", abre o navegador; se Docker, não abre;
- server.hmr: true — ativa Hot Module Replacement;
- server.host: true — escuta em 0.0.0.0 (importante para Docker);
- server.port: 5173 — porta padrão;
- build.outDir: '../public' — output compilado e minificado em public/;
- build.manifest: true — gera manifest.json para rastrear assets;
- rollupOptions — controla chunks, adicionando hash para cache-busting.

4.7 - Vite como Container no Docker Compose
A estrutura de configuração atual já foi preparada para ser containerizada. Um futuro Dockerfile poderia ser:
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
ENV IS_CONTAINER=TRUE
EXPOSE 5173
CMD ["npm", "run", "dev"]

Isso faria o Vite rodar como um container separado no docker-compose.yml, ao lado do backend. Cada entry point (Vite, backend, banco de dados) rodaria em seu próprio container, se comunicando via rede Docker — mantendo separação de responsabilidades e escalabilidade.
4.8 - Configurando TypeScript e Compilação
O arquivo tsconfig.json define como o TypeScript deve compilar:
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}

O Vite já lê esse arquivo automaticamente — não precisa de configuração extra. Quando você salva um .ts, o Vite o compila, verifica tipos, e recarrega o navegador (HMR).
5 - API Contextual: Eliminando Redundância via JWT  
5.1 - O Padrão Atual: ID na URL
Até agora, as chamadas de API passam o ID do usuário como parâmetro na URL:
// deleteApi.js — cliente passa o ID na URL
export async function userDeleteApi(id) {
    const { data } = await clientApi.delete(`/users/${id}`);
    return data;
}

// updateApi.js — cliente passa o ID do usuário na URL
export async function taskUpdateApi(idUser, taskId, updates) {
    const { data } = await clientApi.put(`/users/${idUser}/tasks/${taskId}`, updates);
    return data;
}
Isso funciona, mas tem uma redundância perigosa: o cliente está passando um ID que já está dentro do JWT, no cookie. O backend já sabe quem é o usuário através do token — por que recebe o ID novamente?
5.2 - O Problema: Confiança sem verificação
Se o cliente pode passar qualquer ID na URL, nada impede ele de fazer uma requisição DELETE para /users/42 mesmo se está autenticado como usuário 7. O backend precisa verificar: "esse ID na URL é o mesmo do JWT?" Essa verificação extra é necessária, mas ela revela o real problema: a URL contém informação que já devia estar no token.
// backend: recebe DELETE /users/42
// backend: extrai userId do JWT (que é 7)
// backend: verifica se 42 === 7 → não é, então rejeita
// (mas isso só funciona se o backend lembrar de fazer essa verificação em TODA chamada)
5.3 - Introduzindo API Contextual: ID vem do Token
API Contextual significa que o servidor infere contexto do usuário a partir do token JWT, sem o cliente precisar passar esse dado novamente:
// antes (com redundância)
DELETE /users/42  (com JWT id=7)
→ backend recebe dois "42"s e precisa verificar se correspondem

// depois (API contextual)
DELETE /users/me  (com JWT id=7)
→ backend resolve "/me" como o usuário do token (7)

// ou até omitir o usuário inteiramente em certos endpoints
DELETE /profile
→ backend sabe que é o usuário do token
Essa mudança simplifica e torna mais segura a API: o contexto é único (o token), e não precisa ser repetido em cada URL.
5.4 - Refatorando as APIs para Contextual
userDeleteApi — em vez de passar id, é só DELETE /users/me:
// antes
export async function userDeleteApi(id) {
    const { data } = await clientApi.delete(`/users/${id}`);
    return data;
}

// depois (contextual)
export async function userDeleteApi() {
    const { data } = await clientApi.delete(`/users/me`);
    return data;
}

taskUpdateApi — o ID do usuário sai da URL, apenas o taskId fica:
// antes: DELETE /users/{idUser}/tasks/{taskId}
export async function taskUpdateApi(idUser, taskId, updates) {
    const { data } = await clientApi.put(`/users/${idUser}/tasks/${taskId}`, updates);
    return data;
}

// depois: DELETE /me/tasks/{taskId}
// (ou ainda mais simples, /tasks/{taskId}, deixando o backend inferir a autoria)
export async function taskUpdateApi(taskId, updates) {
    const { data } = await clientApi.put(`/me/tasks/${taskId}`, updates);
    return data;
}

userListApi — se for listar apenas seus próprios usuários (caso admin), a URL muda:
// se o endpoint era /users, continua assim para admin
// mas se era uma cópia pessoal, muda para /me/users ou similar
export async function userListApi({ page = 1, limit = 10 } = {}) {
    const { data } = await clientApi.get("/me", {
        params: { page, limit }
    });
    return data;
}
5.5 - Benefício de Segurança: Menos Pontos de Falha
Concentrar o contexto do usuário no JWT (e não na URL) significa:
- Uma única fonte de verdade: o token diz quem é;
- Menos verificações esquecidas: o backend não precisa verificar se idUser da URL bate com o JWT, porque a URL não tem idUser;
- URLs mais limpas e semânticas: /users/me é mais direto do que /users/7 (que é inútil para o cliente conhecer — ele já sabe quem é).
6 - Conclusão
Esta aula marcou uma evolução crucial em quatro eixos:

1. **Vendor API e Transpilação**: O navegador só entende JavaScript puro (e CSS puro). TypeScript, JSX, Sass não são nativos — precisam ser transpilados. Esse é o conceito fundamental que explica por que pré compiladores existem.

2. **TypeScript + Generics**: TypeScript adiciona tipagem e é transpilado para JS puro. Generics (<T>) permitem escrever código reutilizável e type-safe sem duplicação — visto em ação ao tipar respostas de Axios (clientApi.get<Usuario[]>()), criando APIs type-safe para infinitos tipos.

3. **Vite: Duas Serventias**: Não é só HMR. A verdadeira potência é a pré compilação invisível — TypeScript, JSX, Sass → JavaScript/CSS puro, automaticamente. No desenvolvimento (HMR) e em produção (build otimizado). Já está estruturado para Docker: entry point separado, porta 5173, server.host: true, IS_CONTAINER para decidir comportamento.

4. **API Contextual**: Em vez de o cliente passar ID na URL, o backend o infere do JWT. Uma única fonte de verdade (o token), menos pontos de falha, URLs limpas.
7 - Referências
Documentação TypeScript: Type Basics, Generics, Constraints.
TypeScript Handbook: Generics, Working with Type Variables.
Vite Documentation: Features, Pre-processing, Build Optimization, Server Options.
Vite + Docker: Containerizing Frontend Build Tools.
MDN/Auth Best Practices: Stateless Authentication, Token-Based Access.


Questões do TA:



QUESTÃO 1 

Sobre Generics em TypeScript, é correto afirmar que:

A) Generics são tipos que só funcionam com números e strings; para outros tipos é preciso duplicar a função.

B) Generics são uma forma de escrever código reutilizável e type-safe que funciona com qualquer tipo, usando um placeholder <T> que é substituído quando a função é chamada; evita duplicação de código mantendo verificação de tipos.

C) Generics apenas funcionam dentro de classes; funções não podem ser genéricas.

D) Um generic sem constraints aceita qualquer tipo, mas se você adicionar uma constraint (extends), ele perde a capacidade de ser genérico.

E) Generics são compilados para tipos reais apenas no navegador, não durante a compilação do TypeScript.

Gabarito: B

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2

Sobre o Vite como pré compilador e entry point, é correto afirmar que:

A) O Vite é apenas um servidor com HMR; não compila TypeScript ou outras linguagens.

B) O Vite é um pré compilador completo que transforma TypeScript em JavaScript, compila automaticamente, e pode ser containerizado como um entry point separado no Docker Compose; a configuração atual (root: 'resources', server.host, IS_CONTAINER) já foi preparada para isso.

C) O Vite só funciona com CSS; TypeScript precisa de outro compilador.

D) Pré compiladores removem a necessidade de um servidor web; o Vite gera arquivos .js que rodam sozinhos sem nenhum processo.

E) A pasta resources é opcional; o Vite funcionará sem ela usando raízes padrão.

Gabarito: B

Misturar as alternativas? (x ) Sim (  ) Não


QUESTÃO 3

Sobre API Contextual e a relação entre JWT e URLs, é correto afirmar que:

A) API Contextual significa que o servidor infere o contexto do usuário a partir do JWT no cookie, sem o cliente precisar passar esse dado redundantemente na URL; isso elimina redundância e reduz pontos de falha, porque a URL não contém IDs que já estão no token.

B) API Contextual exige que o cliente continue passando o ID do usuário na URL, mesmo que esteja no JWT, para garantir que o backend sempre receba uma confirmação dupla de identidade.

C) O uso de JWT em cookies já garante automaticamente segurança contra endpoints chamados com IDs incorretos; não há necessidade de refatorar URLs.

D) Remover o ID da URL torna a API menos segura, porque o backend não consegue mais validar quem é o usuário sem receber o ID como parâmetro.

E) API Contextual é apenas uma convenção de nomenclatura; não afeta a segurança ou funcionamento real da aplicação.

Gabarito: A

Misturar as alternativas? (x ) Sim (  ) Não

