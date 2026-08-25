# Props e composição de componentes

Todo componente pode receber conteúdo customizado (texto, imagem) e usar a
tag de outro componente dentro do próprio `.html` — sem precisar escrever
JavaScript pra isso. Este arquivo documenta como.

## `data-prop` — parametrizar texto e qualquer atributo HTML

No `.html` do componente, marque o elemento parametrizável. A regra é uma
só, e cobre qualquer atributo de qualquer elemento:

- `data-prop="nome"` (sem sufixo) → o valor vira o `textContent` do elemento.
- `data-prop-<atributo>="nome"` (com sufixo) → o valor vira o atributo
  `<atributo>` do elemento (`src`, `alt`, `href`, `aria-label`, o que for).

```html
<!-- positivus-example-card.html -->
<div class="card">
  <img
    class="card__image"
    src="./assets/illustrations/example.svg"
    alt="Ilustração do card de exemplo"
    data-prop-src="image"
    data-prop-alt="image-alt"
  />
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>
```

Quem usa o componente passa direto por atributo, sem nenhum elemento extra
— na `index.html`, no `.html` de outro componente, ou numa story do
Storybook:

```html
<positivus-example-card
  title="Consultoria de SEO"
  text="Aumente o tráfego orgânico do seu site."
  image="https://exemplo.com/foto-do-produto.png"
  image-alt="Foto do produto"
></positivus-example-card>

<!-- sem passar nada, usa o conteúdo padrão do componente -->
<positivus-example-card></positivus-example-card>

<!-- passando só um dos props, o resto fica no padrão -->
<positivus-example-card title="Outro título"></positivus-example-card>
```

### `data-prop-<atributo>` — qualquer atributo, não só imagem

`data-prop-alt` (do exemplo acima) não é um caso especial — é só um exemplo
de `data-prop-<atributo>`, que funciona pra **qualquer** atributo HTML. Um
link parametrizável, por exemplo:

```html
<!-- positivus-button.html -->
<a class="button" href="#" data-prop-href="link" data-prop="text">Saiba mais</a>
```

```html
<!-- uso -->
<positivus-button link="https://exemplo.com/contato" text="Fale conosco">
</positivus-button>
```

Um elemento pode ter quantos props diferentes precisar ao mesmo tempo (ex:
`data-prop-href` + `data-prop` no mesmo `<a>`, ou `data-prop-src` +
`data-prop-alt` no mesmo `<img>`) — cada um com seu próprio nome, nenhum
exige que os outros estejam presentes.

Isso funciona porque cada componente novo, gerado por
`npm run generate:component`, já sai com esta linha (ver
[`base-component.md`](./base-component.md)):

```js
static observedAttributes = BaseComponent.extractPropNames(template);
```

Ela é o que permite o navegador chamar `attributeChangedCallback` sempre que
um desses atributos é definido — o `BaseComponent` faz o resto (acha o
elemento marcado, aplica o valor: `textContent` pro `data-prop` sem sufixo,
`setAttribute('<atributo>', valor)` pro `data-prop-<atributo>`). Nenhum
componente escreve esse código à mão.

**Nome do prop sempre em kebab-case** (`is-disabled`, não `isDisabled`) —
atributo HTML é *case-insensitive*, então um nome com letra maiúscula nunca
bateria certo com o que `static observedAttributes` observa.

### `data-prop-toggle-<atributo>` — atributo booleano (`disabled`, `checked`...)

Atributo booleano de HTML é "verdadeiro" só por *existir* — não importa o
texto dentro (`disabled="false"` ainda desabilita). Por isso
`data-prop-<atributo>` comum (que só faz `setAttribute`) não resolve
booleano direito; existe uma terceira variante pra isso:

```html
<!-- positivus-form-button.html -->
<button class="button" data-prop-toggle-disabled="is-disabled">Enviar</button>
```

```html
<!-- uso -->
<positivus-form-button is-disabled="true"></positivus-form-button>
```

`data-prop-toggle-<atributo>` interpreta o valor como `"true"`/`"false"` e
usa `toggleAttribute` (adiciona ou remove o atributo de verdade), em vez de
`setAttribute` — assim `is-disabled="false"` realmente tira o `disabled`.

**Limitações conhecidas** (ver detalhe em `base-component.md`): não dá pra
passar conteúdo rico ou outro componente como "valor" de um prop (só
string); não existe reatividade de formulário nem forma de levar dado de
dentro do componente pra fora (exigiria eventos customizados, um mecanismo
diferente deste); e remover o atributo depois não restaura o conteúdo
padrão original — numa landing page estática isso não costuma importar.

## Imagem como prop — sem cuidado extra

Diferente de texto, uma imagem *local* costumava exigir um `import` do Vite
pra funcionar depois do `npm run build` — mas isso só era necessário porque
a imagem ficava colocada do lado do componente (`positivus-<nome>/images/`).
Hoje as imagens ficam em `public/assets/<funcao>/<arquivo>` (organizadas por
função — `icons/`, `logos/`, `illustrations/`, etc. — ver "Imagens em
`public/assets`" no [`CLAUDE.md`](../../CLAUDE.md)), que o Vite copia como
está pro `dist/`, com caminho estável — então o valor de um prop de imagem
já é o caminho final, sem nenhum processamento:

```html
<positivus-card icon="./assets/icons/seta-direita.svg">
</positivus-card>
```

Isso funciona igual em qualquer lugar — dentro do `.html` de outro
componente, na `index.html`, ou como valor inicial de atributo — porque não
depende de nenhum `import`/script rodar antes: é só uma string que o
`BaseComponent` aplica direto via `setAttribute('src', ...)` (ver
`data-prop-<atributo>` acima).

## Composição — usar um componente dentro de outro

Não precisa de nenhuma sintaxe nova: escreva a tag normalmente dentro do
`.html` do componente (ou da `index.html`), passando prop se quiser:

```html
<!-- dentro do .html de outro componente -->
<positivus-example-card title="Consultoria de SEO"></positivus-example-card>
```

Só falta garantir que o `.js` que define aquele componente seja carregado
em algum lugar da página — é isso que `npm run generate:composition-imports`
automatiza, adicionando o `import` que falta (no `.js` do componente pai, ou
em `src/main.js` se a tag for usada direto na `index.html`). Rode esse
comando depois de usar a tag de um componente já existente dentro de outro.

O preview de desenvolvimento (`/__components/<nivel>/<nome>`, aberto
automaticamente pelo `npm run dev`) já reconhece esse aninhamento sozinho,
carregando o `.js` de cada componente usado ali dentro — não precisa de
nenhum passo manual extra só pra visualizar.

### Repassando prop pro componente aninhado

`data-prop-<atributo>` também funciona numa tag de outro componente, não só
em elementos HTML simples — o valor cai como atributo real na tag aninhada,
que resolve o próprio prop dali (o `positivus-example-card` nem sabe que é
um `positivus-button` do outro lado, só repassa um atributo):

```html
<!-- positivus-example-card.html -->
<positivus-button
  variant="button"
  data-prop-text="button-text"
  data-prop-link="button-link"
></positivus-button>
```

```html
<!-- uso -->
<positivus-example-card button-text="Contratar"></positivus-example-card>
```

`data-prop-text="nome"` é um caso normal de `data-prop-<atributo>` (aplica
via `setAttribute('text', valor)`) — não confundir com `data-prop="nome"`
(sem sufixo, vira `textContent`); são coisas diferentes mesmo quando o
atributo de destino se chama `text`.

## Variação visual (não é prop de conteúdo)

Pra uma variação puramente visual (ex: `variant="secondary"` num botão), não
use `data-prop` — isso é pra texto/imagem. Use um atributo simples + seletor
de atributo no CSS do próprio componente:

```html
<!-- uso -->
<positivus-button variant="secondary">Saiba mais</positivus-button>
```

```css
/* positivus-button.css */
:host([variant="secondary"]) .button {
  background: transparent;
  border: 1px solid currentColor;
}
```

Isso já é reativo sozinho (seletor de atributo do navegador atualiza a
aparência automaticamente quando o atributo muda) — nenhuma mudança no
`BaseComponent` precisa disso.

## Variantes com HTML diferente (`data-variant`)

O padrão anterior (`:host([variant="..."])`) só resolve quando a diferença
é puramente visual. Quando a variante precisa de **estrutura** diferente de
verdade (não só classe/estilo), marque cada versão com `data-variant="nome"`
**dentro do mesmo `.html`** — o `BaseComponent` renderiza só o bloco da
variante ativa; os outros nunca chegam a existir no Shadow DOM (não é
esconder com CSS, é o JS decidindo o que montar):

```html
<!-- positivus-example-card.html -->
<div class="card" data-variant="default">
  <img class="card__image" src="..." data-prop-src="image" data-prop-alt="image-alt" />
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>

<div class="card card--compact" data-variant="compact">
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>
```

```html
<!-- uso -->
<positivus-example-card variant="compact" title="Newsletter" text="Receba novidades por e-mail.">
</positivus-example-card>

<!-- sem passar variant, usa a primeira encontrada no .html (aqui, "default") -->
<positivus-example-card></positivus-example-card>
```

Pontos importantes:

- **Continua um bloco BEM só**: a classe de bloco (`card`) é a mesma em
  todas as variantes; a variante não padrão acrescenta um **modificador**
  (`card--compact`), não cria um bloco novo (`card-compact`). Os elementos
  internos (`card__title`, `card__text`) também são os mesmos nos dois
  blocos — ver a regra de BEM em [`CLAUDE.md`](../../CLAUDE.md).
- **Todas as variantes ficam no mesmo arquivo** — quem for mexer no
  componente vê as opções todas na mesma tela, sem precisar abrir outro
  componente pra comparar.
- **`data-prop` com o mesmo nome pode aparecer em mais de um bloco** (ex:
  `title` nos dois acima) — o `BaseComponent` reaplica o valor certo toda
  vez que troca de variante, então o prop funciona igual não importa qual
  variante está ativa.
- **Nada de JS novo pra escrever**: a mesma linha de sempre,
  `static observedAttributes = BaseComponent.extractPropNames(template);`,
  já inclui `variant` sozinha quando o template tem `data-variant` (ver
  `base-component.md`).
- Se passar um `variant` que não existe no `.html`, cai no padrão (a
  primeira variante encontrada) — nunca quebra.

## Múltiplos eixos de variante (`data-variant-<eixo>`)

Um componente pode ter mais de um eixo de variante **independente e
combinável** ao mesmo tempo — não só o `variant` estrutural acima. O eixo
sem sufixo continua se chamando `variant`; eixos extras usam
`data-variant-<eixo>="valor"` no **mesmo elemento** que já tem
`data-variant` (mesma relação que já existe entre `data-prop` e
`data-prop-<atributo>` — sufixo decide o nome do atributo observado):

```html
<!-- positivus-example-card.html -->
<div class="card" data-variant="default" data-variant-tone="default">
  <img class="card__image" src="..." data-prop-src="image" data-prop-alt="image-alt" />
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>

<div class="card card--highlight" data-variant="default" data-variant-tone="highlight">
  <img class="card__image" src="..." data-prop-src="image" data-prop-alt="image-alt" />
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>

<div class="card card--compact" data-variant="compact" data-variant-tone="default">
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>

<div class="card card--compact card--highlight" data-variant="compact" data-variant-tone="highlight">
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>
```

```html
<!-- uso: os dois eixos combinados -->
<positivus-example-card variant="compact" tone="highlight"></positivus-example-card>
```

Pontos importantes:

- **Todo bloco continua precisando de `data-variant`** — é o marcador raiz
  que identifica "isto é um bloco inteiro"; eixos extras (`data-variant-tone`
  no exemplo) só acrescentam atributo no mesmo elemento, nunca o substituem.
- **Cada combinação é escrita por extenso** — não existe geração dinâmica de
  fragmentos; 2 eixos × 2 valores = 4 blocos completos, cada um visível e
  editável na mesma tela. É a mesma filosofia do `data-variant` de eixo
  único (nada escondido, tudo em HTML), só que agora multiplicado pelas
  combinações. Por causa dessa duplicação, prefira isso pra **no máximo 2
  eixos com poucos valores**; pra mais que isso, ou pra uma variação
  puramente cosmética que não precisa ficar explícita em HTML, volte pro
  atributo simples + `:host([attr="..."])` da seção anterior.
- Continua BEM: cada valor não-padrão de cada eixo é um **modificador**
  (`card--compact`, `card--highlight`) — nunca um bloco novo. Uma
  combinação de dois eixos não-padrão simplesmente acumula os dois
  modificadores na mesma classe (`card card--compact card--highlight`).
- Se uma combinação pedida não existir como bloco escrito, cai no primeiro
  bloco do template — mesmo fallback que já existe hoje pra um valor de
  eixo inválido.
- **Nada de JS novo pra escrever**: a mesma linha de sempre,
  `static observedAttributes = BaseComponent.extractPropNames(template);`,
  já inclui o nome de cada eixo encontrado (`variant`, `tone`...).

## Storybook — props e variantes visíveis pro dev

Todo `.stories.js` gerado por `npm run generate:component` já usa
`src/components/storybook-helpers.js` pra deixar as props (e as variantes,
se houver) editáveis direto no painel **Controls** do Storybook, sem
precisar listar nada à mão. Quando o `.html` tem `data-variant`, o gerador
também já cria uma story pronta por variante encontrada:

```js
import './positivus-example-card.js';
import template from './positivus-example-card.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Molecules/PositivusExampleCard',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-example-card'),
};

export const Default = {
  args: {},
};

export const CustomContent = {
  args: { title: 'Consultoria de SEO', text: 'Aumente o tráfego...' },
};

export const Compact = {
  args: { variant: 'compact', title: 'Newsletter', text: 'Receba novidades por e-mail.' },
};
```

- `argTypesFromTemplate(template)` lê os `data-prop`/`data-prop-<atributo>`
  do próprio `.html` (mesma leitura que `static observedAttributes` já faz)
  e gera um controle pra cada um — texto pra prop normal, um **seletor**
  (`select`) por eixo de variante encontrado (`variant`, `tone`...) — abra a
  story no Storybook, aba **Controls**, e dá pra editar/trocar de variante
  (ou combinar mais de um eixo) ao vivo, sem tocar em código.
- `renderWithArgs(tagName)` aplica cada `args` como atributo na tag — o
  mesmo que aconteceria numa página de verdade.
- `npm run generate:component` gera o `.stories.js` inteiro só quando o
  arquivo ainda não existe — mas se ele já existir e o `.html` ganhar uma
  variante nova depois, rodar o comando de novo **acrescenta** só a story
  da combinação que faltar (procura por `export const <Nome>`; se já
  existir uma com esse nome exato, não faz nada). Nunca sobrescreve o resto
  do arquivo. Com um eixo só, o nome vem de `toPascalCase` do valor de
  `data-variant` (ex: `Compact`); com mais de um eixo, concatena o
  `toPascalCase` de cada valor não-padrão da combinação, na ordem dos eixos
  (ex: `variant=compact` + `tone=highlight` → `CompactHighlight`) — se
  você já tiver uma story com outro nome cobrindo a mesma combinação, o
  comando não vai perceber e vai acrescentar uma redundante; nesse caso,
  apague a que não quiser manter.
