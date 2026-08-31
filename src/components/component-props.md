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
    data-prop-src="src"
    data-prop-alt="alt"
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
  src="https://exemplo.com/foto-do-produto.png"
  alt="Foto do produto"
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

### `data-prop-modifier` — modificador de estilo (soma classe, não substitui)

Nenhum dos marcadores acima resolve bem um caso comum: deixar o **estilo**
de um elemento variar via prop, sem trocar HTML (isso já existe pra um
conjunto fixo de valores conhecidos de antemão, ver "Variantes em arquivo"
mais abaixo — mas às vezes você só quer aceitar qualquer string e virar
classe na hora, sem precisar criar um arquivo por valor). Usar
`data-prop-<atributo>` pra isso seria `data-prop-class="nome"` — **não
faça isso**: `setAttribute('class', valor)` substitui a classe inteira,
apagando a classe BEM que o CSS do componente depende dela pra estilizar.

`data-prop-modifier="nome"` resolve isso direito — soma
`<classe-base>--<valor>` na `classList` (`classList.add`, nunca
`setAttribute`), sem apagar a classe base nem nenhuma outra já presente:

```html
<!-- positivus-example-card.html -->
<div class="card" data-prop-modifier="appearance">...</div>
```

```html
<!-- uso -->
<positivus-example-card appearance="highlight"></positivus-example-card>
<!-- .card vira class="card card--highlight" -->
```

Pontos importantes:

- **A classe-base é sempre a primeira classe já escrita no elemento**
  (convenção BEM: o bloco vem primeiro, ex: `class="card"`) — não precisa
  declarar ela em separado. Se o elemento não tiver **nenhuma** classe, o
  `BaseComponent` lança um erro na hora (em vez de aplicar silenciosamente
  uma classe `"undefined--valor"`) — ver `base-component.md`.
- **Trocar de valor troca o modificador**, não acumula: passar
  `appearance="dark"` depois de `appearance="highlight"` remove
  `card--highlight` antes de somar `card--dark`. Nunca fica com os dois ao
  mesmo tempo.
- **Não aparece como `select` no Storybook**, nem entra na enumeração
  automática do preview de dev (`/__components`, ver "Preview automático de
  componentes" no `CLAUDE.md`) — diferente de um eixo de `variants/`, que
  aparece nos dois. Como qualquer string vira uma classe válida, o controle
  gerado no Storybook é um campo de texto livre, e o preview de dev só
  mostra o valor padrão (mesma regra de qualquer `data-prop`/`data-prop-<atributo>`).
  Prefira `variants/<eixo>/` (abaixo) quando os valores possíveis são
  conhecidos de antemão e você quer que apareçam como opções prontas nos
  dois lugares.

### Apelido, não nome fixo

O `nome` de `data-prop-<atributo>="nome"` **não precisa ser igual ao
`<atributo>`** — `data-prop-href="link"` no exemplo acima expõe o `href`
real do elemento sob o apelido `link`. Isso é o que permite dois elementos
com o mesmo atributo real (ex: dois `<a href>`) virarem **props
independentes**, cada um com seu próprio apelido: ver "Dois elementos com o
mesmo nome de atributo" mais abaixo.

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

### Dois elementos com o mesmo atributo real: apelido igual ou diferente

O `nome` de `data-prop-<atributo>="nome"` é sempre um **apelido** — dois
elementos que usam o mesmo atributo real (ex: dois `<a href>`) podem
compartilhar o mesmo apelido de propósito (os dois recebem o valor juntos)
ou usar apelidos diferentes (cada um vira um prop **independente**).

Exemplo de verdade já no projeto — [`positivus-example-card`](./molecules/positivus-example-card/positivus-example-card.html)
tem a imagem envolvida por um link e um link "Saiba mais" no fim do card,
cada um com seu próprio apelido pro `href`:

```html
<a class="card__image-link" href="#" data-prop-href="image-href">
  <img class="card__image" src="..." alt="..." data-prop-src="src" data-prop-alt="alt" />
</a>
...
<a class="card__link" href="#" data-prop-href="href">Saiba mais</a>
```

```html
<!-- uso: os dois links são independentes -->
<positivus-example-card
  href="https://exemplo.com/produto"
  image-href="https://exemplo.com/produto/galeria"
></positivus-example-card>
```

Se em vez disso os dois usassem o **mesmo** apelido (ex: os dois com
`data-prop-href="href"`), o `BaseComponent` trataria os dois como o mesmo
prop e aplicaria o valor recebido em **ambos** ao mesmo tempo — não no
último encontrado apenas — útil quando de propósito os dois devem sempre
apontar pro mesmo lugar.

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

## Variantes em arquivo (`variants/<eixo>/<valor>.html`)

O padrão anterior (`:host([variant="..."])`) só resolve quando a diferença
é puramente visual. Quando a variante precisa de **estrutura** diferente de
verdade (não só classe/estilo), o componente ganha uma pasta `variants/` —
uma subpasta por eixo, um arquivo por valor não-padrão daquele eixo (o
valor padrão de qualquer eixo é sempre `'default'`, sem arquivo — é o
próprio `.html` principal, ou "nenhuma classe extra"):

```
positivus-example-card/
  positivus-example-card.html   ← default (imagem + título + texto)
  positivus-example-card.css
  positivus-example-card.js
  variants/
    variant/
      compact.html               ← eixo estrutural: bloco completo (sem imagem)
```

```html
<!-- positivus-example-card.html (default) -->
<div class="card">
  <img class="card__image" src="..." alt="..." data-prop-src="src" data-prop-alt="alt" />
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>
```

```html
<!-- variants/variant/compact.html -->
<div class="card card--compact">
  <h2 class="card__title" data-prop="title">Example Card</h2>
  <p class="card__text" data-prop="text">Este é um componente de exemplo.</p>
</div>
```

```html
<!-- uso -->
<positivus-example-card variant="compact" title="Newsletter">
</positivus-example-card>

<!-- sem passar nada, usa o default do eixo -->
<positivus-example-card></positivus-example-card>
```

`variant` é o **único eixo estrutural** — troca a estrutura inteira, tag e
tudo. Um eixo **adicional** (estrutura à parte) funcionaria do mesmo jeito
que `variant`, só que dentro de outra subpasta (ex: `variants/size/large.html`
com só a classe `card--large`, mesma ideia de `variants/<eixo>/<valor>.html`
descrita no início desta seção) — o `BaseComponent` soma a(s) classe(s) do
elemento raiz daquele arquivo na `classList` do elemento raiz já
renderizado, sem duplicar um arquivo por cruzamento com `variant`.

O `positivus-example-card` de verdade **não tem** um segundo eixo em
`variants/` hoje — o `appearance` (`highlight`) dele usa `data-prop-modifier`
em vez de arquivo, já que só tem um valor não-padrão (ver "`data-prop-modifier`"
acima); a sintaxe de uso (`appearance="highlight"`) é a mesma independente
do mecanismo por trás, só muda o que fica escrito no `.html` do componente.

Cada componente carrega isso com uma linha fixa no `.js` (nunca precisa ser
mantida manualmente — funciona igual com 0 ou N arquivos em `variants/`):

```js
import { BaseComponent } from '../../base-component.js';
import template from './positivus-example-card.html?raw';
import styles from './positivus-example-card.css?inline';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export class PositivusExampleCard extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template, variantFiles);

  constructor() {
    super({ template, styles, variantFiles });
  }
}

customElements.define('positivus-example-card', PositivusExampleCard);
```

Pontos importantes:

- **Continua BEM**: cada valor não-padrão de cada eixo é um **modificador**
  (`card--compact`, `card--highlight`) — nunca um bloco/classe nova. Ver a
  regra de BEM em [`CLAUDE.md`](../../CLAUDE.md).
- **`data-prop` funciona normalmente dentro de um bloco de
  `variants/variant/`** (ex: `title` no `compact.html` acima) — o
  `BaseComponent` reaplica o valor certo toda vez que troca de `variant`,
  então o prop funciona igual não importa qual está ativo.
- Se passar um `variant`/eixo de estilo que não existe (ou sem arquivo
  correspondente), cai no padrão daquele eixo — nunca quebra.
- **Prefira no máximo ~2 eixos com poucos valores** — cada eixo de estilo é
  livre (não duplica nada), mas se a variação for puramente cosmética e nem
  precisar ficar explícita em HTML, `:host([attr="..."])` (seção anterior)
  continua uma opção mais simples.

## Storybook — props e variantes visíveis pro dev

Todo `.stories.js` gerado por `npm run generate:component` já usa
`src/components/storybook-helpers.js` pra deixar as props (e as variantes,
se houver) editáveis direto no painel **Controls** do Storybook, sem
precisar listar nada à mão. Quando o componente tem `variants/`, o gerador
também já cria uma story pronta por valor não-padrão de cada eixo:

```js
import './positivus-example-card.js';
import template from './positivus-example-card.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export default {
  title: 'Molecules/PositivusExampleCard',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template, variantFiles),
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

- `argTypesFromTemplate(template, variantFiles)` lê os
  `data-prop`/`data-prop-<atributo>` do `.html` (mesma leitura que
  `static observedAttributes` já faz) e gera um controle pra cada um —
  texto pra prop normal (inclusive `data-prop-modifier`, como o `appearance`
  do `positivus-example-card` — vira campo de texto livre, não `select`,
  então não ganha uma story dedicada automaticamente: dá pra testar valores
  diferentes ao vivo direto no painel Controls), um **seletor** (`select`)
  por eixo de variante encontrado em `variantFiles` (`variant`, no exemplo)
  — abra a story no Storybook, aba **Controls**, e dá pra editar/trocar de
  variante (ou combinar com outros props) ao vivo, sem tocar em código.
- `renderWithArgs(tagName)` aplica cada `args` como atributo na tag — o
  mesmo que aconteceria numa página de verdade.
- `npm run generate:component` gera o `.stories.js` inteiro só quando o
  arquivo ainda não existe — mas se ele já existir e a pasta `variants/`
  ganhar um valor novo depois, rodar o comando de novo **acrescenta** só a
  story daquele valor (procura por `export const <Nome>`; se já existir uma
  com esse nome exato, não faz nada). Nunca sobrescreve o resto do arquivo.
  O nome vem de `toPascalCase` do valor (ex: `Compact`, `Large`) — não gera
  uma story por combinação de dois eixos ao mesmo tempo (isso já dá pra
  fazer ao vivo no painel Controls). Se você já tiver uma story com outro
  nome cobrindo o mesmo valor, o comando não vai perceber e vai acrescentar
  uma redundante; nesse caso, apague a que não quiser manter. Só considera
  eixos que estão em `variants/` — um `data-prop-modifier` nunca ganha
  story automática, mesmo que só tenha um valor não-padrão (vira prop
  comum, editável via Controls, sem gerar nada sozinho).
- O preview de desenvolvimento (`npm run dev`) também mostra **todas as
  combinações** automaticamente, quando o `.js` do componente já existe —
  ver "Preview automático de componentes" no [`CLAUDE.md`](../../CLAUDE.md).
  Mesma ressalva: só combina eixos de `variants/`; um `data-prop-modifier`
  não entra nessa enumeração, só aparece com o valor padrão.
