Briefing para produção audiovisual e de conteúdo 
Aula Completa
2026.2

Professor: Luan Tavares Lourenço
Disciplina: Frontend

Aula:
1☒ 2☐ 3☐ 4☐ 5☐ 6☐ 7☐ 8☐ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐ 

Título da aula: 

Servidor de Arquivos Estáticos e DOM

Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução: HTTP, Arquitetura Cliente-Servidor e o Papel do Frontend
No semestre anterior estudamos backend com Node.js, agora entramos no frontend. Na arquitetura cliente-servidor, o cliente é responsável por consumir os recursos e o servidor por fornecê-los.

O frontend é tudo que é processado no cliente pelo navegador:
- renderização de HTML,
- estilização com CSS,
- processamento de lógica com JavaScript.

Mas é importante reforçar: nem tudo que roda no cliente é frontend. Exemplo: quando usamos curl no terminal para fazer uma requisição HTTP, o curl atua como cliente, mas não é frontend, porque não processa nem renderiza nada visualmente.

O navegador é quem interpreta e processa o frontend, transformando arquivos em páginas interativas.

De forma mais detalhada: o frontend cuida da interface do usuário, enquanto o backend cuida da lógica de negócio e do acesso a dados. O HTTP é o elo que conecta essas duas partes. O navegador envia requisições HTTP ao servidor e recebe como resposta páginas, estilos e scripts, que então são processados e exibidos ao usuário. É por isso que o frontend é fundamental: sem ele, mesmo que o servidor envie dados, o usuário não teria uma interface amigável para interagir.

2 - Docker + Nginx para Servir Arquivos Estáticos
Existem três formas comuns de abrir arquivos HTML:

2.1 - 😔 Abrir diretamente o arquivo no navegador
Método iniciante, basta dar dois cliques no arquivo index.html. Funciona, mas é limitado, não queremos seguir por aí.

2.2 - 😐 Criar um backend que sirva arquivos estáticos
Funciona, mas é custoso porque precisamos de um servidor backend sem necessidade.

2.3 - 😀 Usar um servidor web no Docker (Nginx)
Essa será a nossa abordagem. Criamos um container Nginx via docker-compose que mapeia o diretório ./public e serve os arquivos diretamente, simulando como seria em produção. Ambiente real de servidor, sem backend e padronização com Docker.

Além disso, o docker-compose cria automaticamente uma rede interna para os containers definidos. O Nginx fica acessível nessa rede e, ao referenciar a pasta local ./public no diretório /usr/share/nginx/html dentro do container, os arquivos estáticos ficam disponíveis diretamente para o navegador acessar via http://localhost:[porta]. Ou seja: tudo que colocamos no diretório ./public é servido pelo Nginx como se estivéssemos em produção.

O nginx é configurado desta forma, internamente para a porta 80:

```
server {
    listen 80;
    root /var/www;
    index index.html;
    location / {
        autoindex on;
        try_files $uri $uri/ =404;
    }
    error_page 404 /404.html;
}
```

3 - HTML Semântico e Atributos
Um erro comum é usar apenas divs para estruturar a página:

```
<!-- Estrutura só com divs -->
<div class="header">
  <div class="menu">Menu</div>
</div>
<div class="content">
  <div class="article">Artigo principal</div>
</div>
<div class="footer">
  <div class="info">Rodapé</div>
</div>
```

Essa versão funciona, mas não diz nada sobre o significado de cada parte. Agora, usando tags semânticas:

```
<!-- Estrutura semântica -->
<header>
  <nav>Menu</nav>
</header>
<main>
  <article>Artigo principal</article>
</main>
<footer>
  <p>Rodapé</p>
</footer>
```

No segundo exemplo, só de ler o HTML já entendemos o que cada seção representa. Além disso, navegadores, mecanismos de busca e leitores de tela também interpretam melhor a página.

3.1 - Algumas Tags básicas (não semânticas)
- div → contêiner genérico de bloco.
- span → contêiner em linha.
- img → exibe imagens.
- button → cria botões.
- a → links.
- ul / li → listas.
- form → formulários (veremos mais à frente).

3.2 - Tags semânticas (estruturam com significado)
- header → cabeçalho da página ou seção.
- nav → área de navegação.
- main → conteúdo principal.
- section → seção temática.
- article → conteúdo independente.
- aside → informações adicionais.
- footer → rodapé.

3.3 - Atributos principais
- class → agrupar elementos para CSS/JS.
- id → identificador único.
- src → origem de imagens e scripts.
- data-* → atributos de armazenamento de dado usado no JS.
- value → atributo de valor usado em input, textarea, select, etc.

4 - JavaScript Reativo para DOM – Parte 1
O DOM (Document Object Model) é a representação da página no navegador em forma de árvore de objetos. Cada tag HTML vira um nó que pode ser acessado e manipulado pelo JavaScript.

Mas por que usar JavaScript para manipular o DOM? Porque o HTML sozinho é estático: ele mostra a página como ela foi carregada. Se quisermos que a página responda a ações do usuário, como clicar em um botão, abrir um menu, validar um formulário, adicionar ou remover conteúdo dinamicamente, precisamos do JavaScript. Ele é o elo que torna a interface interativa, reagindo em tempo real sem precisar recarregar toda a página.

4.1 - Selecionar elementos
- querySelector: seleciona o primeiro elemento que corresponde ao seletor CSS. Elemento ou nulo.
- querySelectorAll: seleciona todos os elementos que correspondem ao seletor CSS. Collection de Elementos.
- getElementById: seleciona um elemento pelo seu id. Elemento ou nulo.
- getElementsByClassName: seleciona todos os elementos com a mesma classe. Collection de Elementos.
- getElementsByTagName: seleciona todos os elementos de uma determinada tag. Collection de Elementos.

Exemplos:

```
const titulo = document.querySelector("h1"); // seleciona o primeiro <h1>
const itens = document.querySelectorAll("li"); // seleciona todos os <li>
const form = document.getElementById("loginForm"); // seleciona pelo id
const botoes = document.getElementsByClassName("btn"); // seleciona pela classe
const paragrafos = document.getElementsByTagName("p"); // seleciona pela tag
```

4.2 - Manipular elementos
Exemplo de HTML:

```
<h1 id="titulo">Título original</h1>
```

JS:

- append: adiciona conteúdo no final do elemento.
- prepend: adiciona conteúdo no início do elemento.
- innerText: altera apenas o texto interno.
- innerHTML: altera o HTML interno.
- remove: remove o elemento.
- createElement: cria um novo elemento.
- getAttribute: obtém o valor de um atributo do elemento.
- setAttribute: altera o valor do atributo do elemento.

```
const titulo = document.getElementById("titulo");
// Adicionar conteúdo no final
titulo.append(" 🚀");
// Adicionar conteúdo no início
titulo.prepend("🔥 ");
// Muda apenas o texto interno
titulo.innerText = "Novo título";
// Muda o HTML interno
titulo.innerHTML = "<em>Novo título</em>";
// Remove o elemento
titulo.remove();
```

```
// Cria botão
const botao = document.createElement("button");
// Adiciona um texto no botão
botao.innerText = "Clique aqui";
// Adicionando atributos
botao.setAttribute("id", "meuBotao");
// Adicionando o elemento como filho do body na árvore DOM
document.body.append(botao);
// Obtendo um atributo
console.log(botao.getAttribute("id"));     // "meuBotao"
```

4.3 - Propriedades dos elementos
- value: valor de um tag input (podendo obter ou alterar).
- parentElement: obtém o elemento pai do nó. Elemento único ou nulo.
- children: obtém os filhos. Collection de elementos.
- firstElementChild: obtém o primeiro filho. Elemento único ou nulo.
- lastElementChild: obtém o último filho. Elemento único ou nulo.

```
<div id="pai">
  <input type="text" id="meuInput" value="Texto inicial">
  <p>Primeiro filho</p>
  <span>Segundo filho</span>
  <button>Terceiro filho</button>
</div>
<script>
  const input = document.getElementById("meuInput");
  // value → obter e alterar
  console.log("Valor inicial:", input.value); // pega o valor
  input.value = "Novo valor"; // altera o valor
  console.log("Valor alterado:", input.value);
  // parentElement → pai do input
  const pai = input.parentElement;
  console.log("Pai do input:", pai.id); // "pai"
  // children → lista dos filhos do pai
  console.log("Filhos do pai:", pai.children);
  // firstElementChild e lastElementChild
  console.log("Primeiro filho:", pai.firstElementChild.tagName);
  console.log("Último filho:", pai.lastElementChild.tagName);
</script>
```

4.4 - Event Listener
Exemplo de HTML:

```
<button id="meuBotao">Clique aqui</button>
```

JS:

```
const botao = document.getElementById("meuBotao");
botao.addEventListener("click", () => {
  console.log("Botão clicado!");
});
```

5 - Referências
- MDN Web Docs – Client-Server Overview
- MDN – HTML Semântico
- MDN – Document Object Model (DOM)
- MDN – Manipulating the DOM

Questões do TA:

QUESTÃO 1 

Qual das alternativas descreve corretamente a vantagem de usar um container Nginx com Docker para servir arquivos estáticos em vez de abrir o arquivo HTML diretamente no navegador?

A) Permite que o navegador renderize a página sem precisar do protocolo HTTP.

B) Garante que o código JavaScript seja executado sem precisar de um navegador.

C) Cria um ambiente de servidor real, simulando como os arquivos seriam servidos em produção.

D) Torna desnecessário o uso do navegador, pois o Nginx já renderiza o HTML.

E) Substitui completamente a necessidade de HTML e CSS no frontend.

Gabarito: C)

Misturar as alternativas? ( x) Sim (  ) Não

QUESTÃO 2 

Por que usar tags semânticas (como <header>, <nav>, <main>, <footer>) em vez de apenas divs em um documento HTML?

A) Porque as tags semânticas deixam a página mais colorida automaticamente.

B) Porque os navegadores não conseguem interpretar div.

C) Porque melhoram a interpretação do conteúdo por navegadores, mecanismos de busca e leitores de tela.

D) Porque as tags semânticas eliminam a necessidade de CSS.

E) Porque o HTML semântico é obrigatório para que o JavaScript funcione.

Gabarito: C)

Misturar as alternativas? ( x) Sim (  ) Não

QUESTÃO 3 

No contexto do DOM (Document Object Model), qual das alternativas abaixo descreve corretamente o uso de querySelector?

A) Cria um novo elemento no DOM e insere dentro de um nó pai.

B) Seleciona todos os elementos que possuem um atributo específico.

C) Seleciona o primeiro elemento que corresponde a um seletor CSS fornecido.

D) Remove o elemento selecionado do DOM.

E) Adiciona um evento de clique a um botão.

Gabarito: C)

Misturar as alternativas? ( x) Sim (  ) Não
