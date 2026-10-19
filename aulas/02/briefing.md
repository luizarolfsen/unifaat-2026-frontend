Briefing para produção audiovisual e de conteúdo 
Aula Completa
2026.2

Professor: Luan Tavares Lourenço
Disciplina: Frontend

Aula:
1☐ 2☒ 3☐ 4☐ 5☐ 6☐ 7☐ 8☐ 9☐ 10☐ 11☐ 12☐ 13☐ 14☐ 15☐ 16☐ 

Título da aula: 

CSS, Seletores e JS Reativo

Opção do TA:  Vídeo ☐Texto ☒

1 - Introdução
A Aula 1 estabeleceu o DOM como uma árvore de nós, construída a partir do parsing de HTML, CSS e JS enquanto texto, e apresentou a Vendor API do JS como a ferramenta de criação, inserção e seleção desses nós. A Aula 2 dá continuidade direta a essa linha: a Vendor API ganha profundidade — querySelector e querySelectorAll deixam de ser só sintaxe e passam a ser entendidos pela cardinalidade de class e id. É esse mesmo par de seletores, . e #, que abre a porta para o CSS: os alunos descobrem que a sintaxe que já usam no JS para selecionar elementos é a mesma sintaxe que o CSS usa para estilizar. A partir daí, CSS entra na aula não como um bloco de conteúdo isolado, mas como um segundo consumidor da mesma linguagem de seleção. A aula fecha com o JS reativo — o JS orientado a eventos, que é o verdadeiro traço distintivo do frontend — e com uma reflexão de mercado: CSS puro, hoje, é commodity, resolvido majoritariamente por frameworks prontos.

2 - O DOM e a Vendor API
querySelector retorna o primeiro elemento que casa com o seletor informado, ou null quando nada é encontrado; querySelectorAll retorna uma NodeList com todos os elementos que casam. O ponto a reforçar não é a sintaxe em si, já vista na Aula 1, mas o motivo de ela aceitar seletores CSS: é a mesma linguagem de seleção usada em dois contextos diferentes, estilizar e manipular.
Dois conceitos merecem definição explícita antes de avançar. HTMLElement é o tipo de objeto que representa um nó da árvore do DOM depois que a tag HTML foi parseada — é ele que carrega propriedades como id, class e, como será visto adiante, style. NodeList é o tipo de coleção retornado por métodos que buscam múltiplos elementos, como querySelectorAll — parece um array (tem índice, tem length), mas não é um array de JS puro, e por isso alguns métodos de array não estão disponíveis diretamente nela.

2.1 - Cardinalidade de class e id
id e class merecem ser ensinados pela relação que estabelecem com o elemento, não só pela sintaxe. O id é 1 para 1: um elemento tem no máximo um id, e aquele id não se repete em nenhum outro elemento do documento — relação exclusiva. A class é n para n: um elemento pode carregar várias classes, e uma mesma classe pode estar presente em quantos elementos forem necessários — relação muitos-para-muitos. Essa diferença de cardinalidade é o que explica, na prática, por que busca por id sempre devolve um elemento único e busca por classe naturalmente devolve coleções.

2.2 - HTMLElement, style e navegação na árvore
Depois de id e class (com name reservado para a aula de Forms), a propriedade que completa o HTMLElement nesta aula é style. No HTML, o atributo style recebe uma string com declarações CSS separadas por ponto e vírgula, escritas do jeito normal, com hífen. No JS, esse mesmo atributo é acessado como um objeto — elemento.style — e cada propriedade CSS perde o hífen e ganha camelCase: 
- background-color: backgroundColor
- font-size: fontSize
- line-height: lineHeight

```
// elemento.style dá acesso às propriedades CSS via objeto
// cada propriedade em kebab-case no CSS vira camelCase no JS
// Não retorna valor (undefined)
// equivalente a background-color no CSS
destaque.style.backgroundColor = "#f0f0f0";
// equivalente a font-size no CSS
destaque.style.fontSize = "18px";
// equivalente a line-height no CSS
destaque.style.lineHeight = "1.5";          
```

A propriedade style, por ser do próprio elemento, não exige HTML novo, e conecta diretamente com o CSS que vem a seguir na aula. A navegação na árvore, que na Aula 1 ficou restrita a append/prepend, ganha os métodos que sobem e atravessam a hierarquia de irmãos e pais.

```
// querySelector busca o primeiro elemento que casa com o seletor
// Retorna: Element ou null
const destaque = document.querySelector(".destaque");
// querySelectorAll busca todos os elementos que casam com o seletor
// Retorna: NodeList
const todosDestaques = document.querySelectorAll(".destaque");
// children retorna os filhos diretos do elemento (ignora nós de texto)
// Retorna: HTMLCollection
const filhos = destaque.children;
// firstElementChild / lastElementChild retornam o primeiro e o último filho
// Retorna: Element ou null
const primeiroFilho = destaque.firstElementChild;
const ultimoFilho = destaque.lastElementChild;
// parentElement retorna o elemento pai
// Retorna: Element ou null
const pai = destaque.parentElement;
// closest sobe a árvore até achar um ancestral que casa com o seletor
// Retorna: Element ou null
const container = destaque.closest(".container");
```

Vale ainda situar essa API dentro da hierarquia de objetos do próprio navegador: Node é a classe base de qualquer nó (elemento, texto, comentário, o próprio documento); Element herda de Node e representa nós de tags HTML ou SVG; HTMLElement herda de Element e é a especialização para elementos HTML, trazendo classList, style, innerHTML e outras propriedades específicas. Entender essa cadeia ajuda o aluno a perceber por que nem todo método de manipulação está disponível em todo nó da árvore.

3 - CSS
CSS, assim como HTML e JS, é texto — uma string com sintaxe própria de seletor (o que estilizar) e propriedade/valor (como estilizar). O objetivo aqui não é esgotar propriedades, mas situar o CSS como mais um consumidor dos seletores .classe e #id já apresentados no JS.

3.1 - Display: block, inline e inline-block
display é a propriedade que decide como o elemento se comporta no fluxo da página. O modo block ocupa toda a largura disponível e quebra linha automaticamente — é o comportamento padrão de div e p. O modo inline ocupa só o espaço do próprio conteúdo, sem quebrar linha, e não aceita width/height nem margens verticais — é o caso de span e a. inline-block é o meio-termo entre os dois: não quebra linha como o inline, mas aceita dimensões e espaçamentos como o block. flex transforma o elemento em um container que organiza seus filhos com muito mais controle de alinhamento, mas fica de fora dos exemplos práticos desta aula — quem quiser se aprofundar tem o Flexbox Froggy indicado nas referências.

```
/* display define como o elemento se comporta no fluxo da página */
.caixa {
  display: inline-block;
  width: 200px;
  padding: 8px;
}
```

3.2 - Responsividade e media queries
Com a diversidade de dispositivos atuais, uma página precisa se adaptar a diferentes tamanhos de tela, e é isso que a responsividade resolve. O ponto de partida é o viewport, a área visível do navegador, configurado via meta tag:
HTML

```
<!-- define a área visível em dispositivos móveis -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Media queries aplicam regras de CSS condicionadas ao tamanho da tela:
CSS

```
/* aplica o estilo somente quando a tela tiver até 768px de largura */
@media (max-width: 768px) {
  body { background-color: lightblue; }
}
```

Vale citar a abordagem mobile first: escrever primeiro os estilos para telas pequenas e, progressivamente, adicionar regras para telas maiores com min-width — prática que garante que o site funcione bem no celular antes de se expandir para telas maiores.

3.3 - Seletores avançados
Além de tag, classe e id, o CSS tem seletores de hierarquia que expressam relação entre elementos, seletores de atributo que testam o valor de um atributo, e pseudo-classes que capturam estados específicos do elemento.
CSS

```
/* seletores de hierarquia: expressam relação entre elementos */
*      {}   /* TODOS */
A B    {}  /* descendente: qualquer filho em qualquer nível de A */
A > B  {}  /* filho direto: B precisa ser filho imediato de A */
A + B  {}  /* irmão imediato: B vem logo depois de A, mesmo pai */
A ~ B  {}  /* irmãos subsequentes: B vem depois de A, mesmo pai */
section > ul li a {} /* link dentro de item de lista, filho direto de uma lista dentro de uma seção */
/* seletores de atributo: testam o valor de um atributo do elemento */
[disabled] {}        /* possui o atributo disabled */
[type="text"] {}      /* atributo com valor exatamente igual a "text" */
[href^="https"] {}    /* valor do atributo começa com "https" */
[src$=".png"] { }      /* valor do atributo termina com ".png" */
[class*="alert"] { }   /* valor do atributo contém "alert" em qualquer posição */
/* pseudo-classes: selecionam elementos em estados específicos */
:first-child { }   /* elemento que é o primeiro filho do seu pai */
:last-child { }    /* elemento que é o último filho do seu pai */
:nth-child(n) { }  /* elemento na posição n entre os filhos do pai */
:hover { }         /* elemento enquanto o mouse está sobre ele */
:focus { }         /* elemento enquanto está em foco (ex.: input selecionado) */
O ponto que fecha essa seção é que todos esses seletores — hierarquia, atributo, pseudo-classe — funcionam igualmente dentro da Vendor API do JS, na mesma sintaxe:
// os mesmos seletores usados em CSS funcionam em querySelector/querySelectorAll
// Retorna: Element ou null
const primeiroLink = document.querySelector("section > ul li a");
// Retorna: NodeList
const inputsTexto = document.querySelectorAll('[type="text"]');
// Retorna: NodeList
const primeirosFilhos = document.querySelectorAll(".lista :first-child");
```

4 - JS Reativo
O JS de frontend não é só a Vendor API de manipular class e id — ele é, na sua essência, orientado a eventos. É esse traço, e não a manipulação de DOM em si, que separa o JS original do JS de backend visto na Aula 1.

4.1 - addEventListener e o objeto event
O núcleo prático da aula é registrar um listener e entender o parâmetro event que ele recebe. event.target é o elemento onde o evento efetivamente ocorreu, que pode ser um filho interno; event.currentTarget é o elemento no qual o listener foi registrado. É esse contraste que justifica, na prática, usar closest() dentro de um handler para achar o elemento "clicável" mesmo quando o clique bate num filho. Junto com esse par, vale apresentar event.stopPropagation(): eventos se propagam pela árvore (o clique num filho também "borbulha" para os pais que tenham listener no mesmo evento), e stopPropagation() interrompe essa propagação, impedindo que listeners de elementos ancestrais sejam disparados pelo mesmo evento.

```
// addEventListener registra uma função callback para reagir a um evento
// Não retorna valor (undefined)
container.addEventListener("click", function (event) {
  // target: o elemento onde o clique de fato ocorreu (pode ser um filho)
  console.log("target:", event.target);
  // currentTarget: o elemento no qual o listener foi registrado
  console.log("currentTarget:", event.currentTarget);
  // closest sobe a árvore a partir do target até achar o elemento clicável
  const item = event.target.closest(".item");
  // stopPropagation impede que o evento continue subindo para os pais
  // Não retorna valor (undefined)
  event.stopPropagation();
});
```

É nesse ponto que o conceito de callback se torna concreto: o listener é uma função passada como argumento, que o navegador chama sozinho quando o evento acontece. Vale reforçar esse contraste com o JS de backend, que não tem esse modelo orientado a evento de interface.

4.2 - type="module"
Conforme os scripts de frontend crescem, a tendência é separá-los em múltiplos arquivos, e <script type="module" src="..."> é o que habilita isso de forma organizada, trazendo import/export nativos do navegador. Não é o momento de aprofundar em import/export, só de justificar por que o hábito de um único script inline vai deixar de ser suficiente.

```
<!-- type="module" habilita import/export nativos entre arquivos JS -->
<script type="module" src="./app.js"></script>
```

5 - CSS como commodity
Depois de ver seletores, propriedades e a lógica de estilização manual, cabe uma virada de perspectiva sobre como CSS é tratado no mercado. Escrever CSS puro para cada projeto, do zero, é cada vez mais raro em produção. A indústria tende a resolver estilização com frameworks prontos — Bootstrap e Tailwind são os exemplos mais usados — que entregam classes já estilizadas para os problemas mais comuns de layout e componente, como espaçamento, grid e alinhamento. Isso não torna o CSS manual inútil: pelo contrário, é justamente o entendimento de seletor, propriedade e display construído nesta aula que permite entender o que essas classes prontas fazem por debaixo, em vez de usá-las como caixa-preta. CSS, nesse sentido, se comporta como uma commodity: a base é a mesma em todo lugar, e o valor está em quem sabe compor bem as ferramentas construídas sobre ela.

6 - Conclusão
A Vendor API do DOM ganhou profundidade nesta aula: os seletores . e # passaram a ser entendidos pela cardinalidade de classe e id, o HTMLElement somou a propriedade style à lista que já tinha id e class, com a conversão de kebab-case para camelCase como ponte entre CSS e JS, e a navegação na árvore se estendeu para filhos, pais e ancestrais. O CSS entrou como um segundo consumidor dessa mesma linguagem de seletores, com display e inline-block como propriedade central, responsividade e media queries como resposta à diversidade de dispositivos, e seletores avançados de hierarquia, atributo e estado como complemento. O JS reativo trouxe o paradigma de eventos como diferencial real do frontend, com target, currentTarget e stopPropagation explicando o que é callback e propagação na prática, e type="module" preparou estruturalmente a turma para os scripts mais longos que virão. CSS como commodity fecha a aula com o gancho de mercado para os frameworks que aparecerão mais adiante no curso.

7 - Referências
Flexbox Froggy — material de auto-estudo de display: flex.
MDN — EventTarget.addEventListener(), Event.target, Event.currentTarget, Event.stopPropagation().
MDN — HTMLElement.style, Element.children, Element.closest().
MDN — JavaScript modules (<script type="module">).
MDN — Media Queries e responsividade.

Questões do TA:


QUESTÃO 1 

Sobre a relação entre os seletores usados em CSS (.classe, #id) e os métodos querySelector/querySelectorAll do JavaScript, é correto afirmar que:

A) São linguagens de seleção completamente diferentes, e a semelhança na sintaxe entre .classe no CSS e .classe no querySelector é apenas coincidência.

B) O CSS e o JS reutilizam a mesma linguagem de seletores, o que permite que uma expressão como section > ul li a funcione igualmente para estilizar no CSS e para buscar elementos com querySelector.

C) querySelector aceita apenas seletores de tag e classe, enquanto seletores de id só podem ser usados diretamente em CSS.

D) querySelectorAll exige uma sintaxe própria de seleção, distinta da usada em folhas de estilo CSS, para evitar ambiguidade entre os dois contextos.

E) Seletores avançados, como os de atributo ([type="text"]) e pseudo-classes (:hover), existem apenas no CSS e não podem ser usados como argumento em querySelector ou querySelectorAll.


Gabarito: B)

Misturar as alternativas? ( x) Sim (  ) Não


QUESTÃO 2 

Sobre a cardinalidade dos atributos id e class em um documento HTML, é correto afirmar que:

A) Tanto id quanto class podem se repetir livremente em quantos elementos forem necessários, sem nenhuma restrição de unicidade.

B) O id estabelece uma relação de 1 para 1 com o elemento, não devendo se repetir em nenhum outro elemento do documento, enquanto a class estabelece uma relação de n para n, podendo estar presente em vários elementos e um elemento podendo ter várias classes.

C) O id estabelece uma relação de n para n, já que pode ser reaproveitado em diversos elementos, enquanto a class é sempre única por elemento.

D) Um elemento pode ter no máximo um id e no máximo uma class, o que torna ambos os atributos equivalentes em termos de cardinalidade.

E) A class é 1 para 1 porque cada classe só pode ser aplicada a um único elemento por vez, enquanto o id é n para n por poder ser reaproveitado.


Gabarito: B)

Misturar as alternativas? (x ) Sim (  ) Não


QUESTÃO 3 

Sobre o comportamento de event.target e event.currentTarget dentro de um listener registrado com addEventListener, é correto afirmar que:

A) event.target e event.currentTarget são sempre o mesmo elemento, já que ambos se referem ao elemento em que o evento foi registrado.

B) event.target é o elemento onde o listener foi registrado, enquanto event.currentTarget é o elemento onde o evento efetivamente ocorreu, podendo ser um filho.

C) event.currentTarget é o elemento onde o listener foi registrado, enquanto event.target é o elemento onde o evento efetivamente ocorreu — podendo ser um filho interno, o que justifica o uso de closest() para localizar o elemento de interesse a partir dele.

D) event.target só existe em eventos de teclado, enquanto event.currentTarget só existe em eventos de clique.

E) stopPropagation() altera o valor de event.target, fazendo com que ele passe a apontar para o elemento no qual o listener foi registrado.


Gabarito: C)

Misturar as alternativas? (x ) Sim (  ) Não
