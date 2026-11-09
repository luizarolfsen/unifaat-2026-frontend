# Slides interativos (FE) — padrão para as próximas aulas

Arquivos compartilhados: `assets/slide-interativo.css` e `assets/slide-interativo.js` (modelo: `aulas/08/slide/`).
Se o padrão mudar, mude **aqui** e nos dois arquivos de `assets/`, nunca dentro da aula.

## Carregamento (ordem importa)
- `<link>` de `slide.css`, `slide-16x9.css`, `slide-interativo.css`.
- No fim do body: `slide-interativo.js` **antes** de `slide.js` (as miniaturas clonam o slide já com o estado inicial desenhado) e depois `slide-16x9.js`.
- Sem `id` nos widgets (as miniaturas clonam o HTML): tudo por classe/atributo `data-*`.

## Estilo de bloco de código (vale para TODOS os slides)
- **Código em negrito.**
- **Comentário que explica, em peso normal e itálico**: `.dim` nos blocos `.tree` e `.c` nos `pre.cod`. Comentário = explicação curta, não repete o código.
- Já está no CSS (`.deck .tree`, `.deck pre.cod`): basta usar as classes `dim` e `c` para comentários.

## Regras do código de exemplo (React/TSX)
- Só `const`, nunca `let` em componente (valor derivado: `const x = cond ? a : b`).
- Estado booleano: `const [isDone, setIsDone] = useState(false)` (prefixo `is`/`setIs`).
- Evento de clique explícito: função nomeada ligada no JSX (`onClick={aoClicar}`) e mostrada no passo a passo (clique → handler → setState → função roda inteira).
- Sem `else`/`else if`. Contexto dos exemplos: tasks (CRUD), tipo `Task { id, name, is_done }`.
- Demo de JS puro (cópia de primitivos) pode usar `let`; demo propositalmente errada fica marcada como ERRADO.

## Princípios dos interativos
- Simples e curtos: 4–5 passos, algo que dê para mostrar em aula.
- Coloridos e com ênfase: uma cor por parte (`--c-params`, `--c-codigo`, `--c-retorno`, `--c-uso`), sempre com variáveis nas duas paletas (claro e escuro), nunca hex solto fora de `:root`.
- Setas de referência: tracejadas animadas com bolinha andando (igual rede docker).
- Memória: quadrado "memória do programa" com **pilha e heap lado a lado** (regiões irmãs, nunca uma dentro da outra), setas das variáveis de referência para o objeto no heap.

## Indicador de ação (obrigatório)
- Todo elemento que **executa algo ao clicar** (botão, item da lista, aba) leva a classe `acao`: aparece uma bolinha ▶ pulsando no canto, para o aluno saber onde clicar. Item que não parece botão (ex.: `<li>` da task) leva também `acao-pill` (vira a pílula "▶ clique").
- O indicador some sozinho em botão já selecionado (`aria-pressed="true"`, `aria-selected="true"`) ou desabilitado, e não sai no PDF.
- Botões que geram ação, com resposta visual imediata, são o padrão a repetir em todos os slides (elogiado pelo Luan).

## Teclado
- `← →` (e espaço, PageUp/PageDown) trocam de slide.
- `↑ ↓` acionam o vai e volta do interativo do slide aberto (passos, abas, semáforo). `N` / `B` fazem o mesmo. Slide sem interativo: ↑ ↓ não fazem nada.
- `P` para / retoma a animação do passo a passo e das abas do slide aberto.

## Autoplay (sem botões)
- **Passos e abas animam sozinhos, em loop** (passo a cada ~2,8 s; o último fica mais tempo; abas a cada ~4 s), **sem nenhum botão na tela** (os ‹ › da barra ficam escondidos; a legenda e o contador continuam). Só anda enquanto o slide está aberto; ao reabrir recomeça do passo 1.
- Teclado: **`P`** para/retoma; **↑ ↓ / N B** vão passo a passo e **param** a animação; clicar numa aba (o próprio rótulo) também para.
- No PDF nada se mexe: cada widget mostra o `data-print`. `prefers-reduced-motion` começa parado.
- **Re-render e foto também animam sozinhos** (a cada ~6 s / ~7,5 s o autoplay faz o clique que o aluno faria: estado muda, parâmetro muda; modo direta x função). O clique na mão continua valendo, e `P` para/retoma. Só o semáforo segue acionado por clique.

## Widgets (markup mínimo)
| Widget | Marcação | Notas |
|---|---|---|
| Passo a passo | `<div class="w passos" data-passos="N" data-print="P">` com `.cena`, `.w-barra`, `<ol class="passos-legendas">` | elementos aparecem com `data-de="a"` (e `data-ate="b"`); linha do código acende com `data-ativo="1 3"`; `data-print` = passo que sai no PDF |
| Memória + setas | `<div class="cena mem">` com `.memoria` (`.memoria-corpo`, `svg.setas`) | origem: `data-aponta="id"`; destino: `data-alvo="id"`; seta some junto com o `data-de` da origem |
| Abas (anatomia) | `<div class="w" data-abas>` | `data-aba` (botão), `data-parte` (trecho de código), `data-texto` (explicação); `data-rotulo` = etiqueta no canto |
| Semáforo / máquina de estados | `<div class="w" data-semaforo>` | tabela de transição + `.sem-passa` |
| Re-renderização (estado e parâmetro) | `<div class="w" data-render>` | linhas `data-l`, eventos `data-ev`, fases `data-fase`; frame da função aparece na pilha |
| Foto do estado (`setX(x+1)` x forma de função) | `<div class="w" data-foto>` | alterna o modo e mostra o que o React recebe |

## PDF
`google-chrome --headless --disable-gpu --password-store=basic --no-pdf-header-footer --print-to-pdf=<saida>.pdf file://.../slide/index.html`. Cada widget imprime o passo de `data-print`; as setas são redesenhadas na impressão. Conferir o PDF em imagem (`pdftoppm`) antes de entregar.

## Variantes de cor (Aula 09)
- `--c-efeito` (rosa) = o que roda **depois** da tela (`useEffect`); `--c-ref` (ciano) = referência/heap. Nas duas paletas.
- Fluxo em caixas: `<div class="cx efeito">` e `<div class="cx ref">` (além de `cli`/`srv`). Em texto de código: `<span class="efeito">`, `<span class="ref">`, `<span class="erro">` (demo errada).
- `.chip-passo` = etiqueta que aparece por passo (ex.: "efeito: GET ..."), dentro de um `.slot` com `data-de`/`data-ate`.
- `.var .slot.v`: valor de variável que **troca por passo** (vários `<span data-de data-ate>` empilhados no mesmo lugar, só um visível). Modelo: `aulas/09/slide/`.

## Mock de tela com log que se escreve sozinho (Aula 09)
- `.mock-tela` (`.mock-barra`, `.mock-corpo`, `.mock-estados`, `.mk-*`, `.mock-log .l`): um quadro simples de "tela do projeto" em HTML/CSS, sem screenshot. As linhas do `.mock-log` aparecem em sequência por animação CSS em loop (`animation-delay` por `nth-child`), sem botão; no PDF todas aparecem.
- `.fluxo .cx.erro`: caixa de passo "ERRADO" (borda e número na cor `--warn`).
- `.dois-fixos`: duas colunas (código | mock) que **não empilham** no PDF, ao contrário de `.two-col`.
