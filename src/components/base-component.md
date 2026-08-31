# BaseComponent

`BaseComponent` (`src/components/base-component.js`) é a classe base de todos os Web Components deste projeto. Todo componente deve estendê-la em vez de `HTMLElement` diretamente, passando `template`/`styles` pro `super(...)`:

```js
import { BaseComponent } from '../../base-component.js';
import template from './positivus-example-card.html?raw';
import styles from './positivus-example-card.css?inline';

export class PositivusExampleCard extends BaseComponent {
  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-example-card', PositivusExampleCard);
```

- `template`: string com o HTML do componente (conteúdo do arquivo `.html?raw`).
- `styles`: string com o CSS do componente (conteúdo do arquivo `.css?inline`).
- `variantFiles` (opcional): objeto no formato que `import.meta.glob('./variants/**/*.html', { eager: true, query: '?raw', import: 'default' })` produz — só precisa passar quando o componente tem uma pasta `variants/` (ver seção própria abaixo).

## O que o `super(...)` faz

1. **`attachShadow({ mode: 'open' })`** — cria o Shadow DOM do elemento, isolando seu markup e CSS do resto da página.
2. **Se `styles` foi passado**, aplica o CSS ao Shadow DOM via *constructable stylesheet* (`CSSStyleSheet` + `adoptedStyleSheets`), em vez de uma tag `<style>` no template — permite que o mesmo CSS já parseado seja reaproveitado por várias instâncias do componente.
3. **Se `template` foi passado**, injeta o HTML no Shadow DOM (`shadowRoot.innerHTML`) — o bloco estrutural certo (o `template` padrão, ou um bloco de `variantFiles` quando o atributo `variant` pede um) — e soma as classes de qualquer eixo de estilo ativo no elemento raiz (ver seção própria abaixo).

## `$(selector)` e `$$(selector)`

Atalhos para `this.shadowRoot.querySelector`/`querySelectorAll` — evitam repetir `this.shadowRoot.` toda vez que uma classe filha precisa achar um elemento dentro do seu próprio markup.

## `data-prop`, `static extractPropNames` e `attributeChangedCallback`

`BaseComponent` também é responsável por deixar um componente receber conteúdo customizado via atributo (prop), sem nenhum JS por componente. A regra é uma só, e vale pra qualquer atributo HTML de qualquer elemento:

- `data-prop="nome"` (sem sufixo) → aplica o valor em `textContent` do elemento.
- `data-prop-<atributo>="nome"` (com sufixo) → aplica o valor via `setAttribute('<atributo>', valor)` — funciona pra `src`, `alt`, `href`, `aria-label`, ou qualquer outro atributo padrão de HTML, sem o `BaseComponent` precisar conhecer o tipo do elemento.
- `data-prop-toggle-<atributo>="nome"` → variante pra atributo **booleano** (`disabled`, `checked`, `required`, `hidden`...): aplica via `toggleAttribute('<atributo>', valor === 'true')`, decidindo se o atributo existe ou não — diferente do `data-prop-<atributo>` normal, que só seta o valor (e não resolveria booleano certo, ver "Limitações conhecidas" abaixo).
- `data-prop-modifier="nome"` → variante pra **modificador de estilo BEM**: em vez de `setAttribute`, soma `<classe-base>--<valor>` na `classList` do elemento via `classList.add` — nunca substitui a classe inteira (diferente de um hipotético `data-prop-class`, que apagaria a classe base junto). A classe-base é sempre a **primeira** classe já escrita no elemento. Trocar de valor remove o modificador aplicado da vez anterior antes de somar o novo, então não acumula (`card--highlight` → `card--dark`, nunca os dois ao mesmo tempo).

```html
<img class="card__image" src="..." data-prop-src="src" data-prop-alt="alt" />
<a class="card__link" href="#" data-prop-href="link">Saiba mais</a>
<h2 class="card__title" data-prop="title">Example Card</h2>
<button class="card__button" data-prop-toggle-disabled="is-disabled">Enviar</button>
<div class="card" data-prop-modifier="appearance">...</div>
```

```html
<!-- uso -->
<positivus-x appearance="highlight"></positivus-x>
<!-- .card vira class="card card--highlight" -->
```

**O `nome` é um apelido, não precisa ser igual ao `<atributo>` real** (`data-prop-href="link"` acima expõe o `href` real do elemento sob o nome `link`) — é isso que permite dois elementos com o mesmo atributo real (ex: dois `<a href>`) virarem **props independentes**, cada um com seu próprio apelido; se dois elementos usarem o mesmo apelido de propósito, os dois recebem o valor juntos (ver "Limitações conhecidas" abaixo).

**Nome do prop sempre em kebab-case** (ex: `is-disabled`, não `isDisabled`): o valor de `data-prop`/`data-prop-<atributo>`/`data-prop-toggle-<atributo>`/`data-prop-modifier` se torna o nome de um atributo HTML real (`<positivus-x is-disabled="true">`), e atributos HTML são *case-insensitive* — `element.setAttribute('isDisabled', ...)` vira `isdisabled` (tudo minúsculo) na hora, então um prop com letra maiúscula no nome nunca bateria com o que `static observedAttributes` espera, e o `attributeChangedCallback` nunca dispararia pra ele.

```js
export class PositivusExampleCard extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}
```

- `BaseComponent.extractPropNames(template)`: lê os nomes de `data-prop`/`data-prop-<atributo>` presentes na string do template. Usado pra declarar `static observedAttributes` — obrigatório pro navegador saber quais atributos observar e disparar `attributeChangedCallback`. Todo componente gerado por `npm run generate:component` já sai com essa linha.
- No `constructor`, depois de montar o `shadowRoot.innerHTML`, o `BaseComponent` varre todo elemento do Shadow DOM procurando atributos que comecem com `data-prop` e guarda um mapa nome do prop → **lista** de `{ elemento, alvo }` (`alvo` é `null` pro `data-prop` sem sufixo — sinal interno de "aplique em `textContent`" —, ou o nome do atributo pro `data-prop-<atributo>`).
- `attributeChangedCallback(name)` aplica o valor em **todos** os elementos daquela lista — chamado automaticamente pelo navegador, tanto pro valor inicial (se o atributo já vier preenchido no HTML) quanto pra mudanças depois.
- Um mesmo elemento pode ter vários props ao mesmo tempo, cada um com seu próprio nome (ex: `data-prop-src="src"` + `data-prop-alt="alt"` no mesmo `<img>`) — não tem limite de quantos atributos diferentes um elemento aceita.
- **Cada nome de prop guarda uma lista de elementos, não um só**: se dois elementos do mesmo componente usarem o mesmo apelido (por acidente, ou de propósito), os dois são tratados como o mesmo prop e recebem o valor juntos — nunca um sobrescreve o outro silenciosamente. Se a intenção era ter valores independentes, a saída é dar apelidos diferentes a cada um (ver acima).

**Limitações conhecidas** (nenhuma bloqueia o uso atual do projeto, mas vale saber):
- **Nunca use `data-prop-class="nome"`** — não existe tratamento especial pra `class` como atributo comum, então cairia no `setAttribute('class', valor)` normal, que **substitui** a classe inteira do elemento (apagando a classe BEM que o CSS do componente depende). Pra somar uma classe sem apagar as outras, use `data-prop-modifier` acima.
- **`data-prop-modifier` exige que o elemento já tenha uma classe** — a classe-base vem de `element.classList[0]`; se o elemento marcado não tiver nenhuma classe escrita, o `BaseComponent` lança um erro na hora (`#bindProps`), em vez de aplicar silenciosamente uma classe `"undefined--valor"`. Os outros marcadores (`data-prop`, `data-prop-<atributo>`, `data-prop-toggle-<atributo>`) não têm esse risco — o alvo deles sempre vem de um grupo obrigatório do regex sobre o **nome do atributo**, nunca de uma propriedade do DOM que possa faltar.
- **Conteúdo rico ou outro componente como "valor"** (não uma string) não é coberto por `data-prop` — um atributo HTML só carrega texto. Pra isso, a única forma seria slot (mecanismo descartado neste projeto, ver `component-props.md`).
- **Reatividade de formulário** (`value`/`checked` de `<input>`, que representam o estado *atual*, não só o padrão) tende a exigir a propriedade do DOM em vez de `setAttribute` — não é um caso usado no projeto ainda. Também não existe hoje nenhuma forma de levar dado de dentro do componente pra fora (ex: o que o usuário digitou) — isso exigiria eventos customizados (`dispatchEvent`), um mecanismo diferente do `data-prop` (que só leva dado de fora pra dentro).

## `variants/<eixo>/<valor>.html`, `static parseVariantFiles` e eixos de variante

Quando um componente precisa de **HTML** diferente por variante (não só CSS), a pasta dele ganha uma subpasta `variants/` — uma subpasta por eixo, um arquivo por valor não-padrão daquele eixo (o valor padrão de qualquer eixo é sempre `'default'`, sem arquivo):

```
positivus-example-card/
  positivus-example-card.html   ← default
  variants/
    variant/
      compact.html               ← eixo estrutural: bloco completo
    size/
      large.html                  ← eixo de estilo: só a classe (ilustrativo — o positivus-example-card de verdade não tem esse eixo)
```

`variant` é o **único** eixo estrutural: `variants/variant/<valor>.html` é um bloco HTML completo que substitui o `template` inteiro quando ativo — os outros valores nunca chegam a existir no Shadow DOM (não é `display: none`, é o JS simplesmente não montando aquele bloco). Qualquer outro eixo (ex: `size`) é um eixo de **estilo**: `variants/<eixo>/<valor>.html` carrega só um elemento com a(s) classe(s) modificadora(s), ex:

```html
<!-- variants/size/large.html -->
<div class="card--large"></div>
```

O `BaseComponent` soma essas classes na `classList` do elemento raiz já renderizado (o `template` padrão, ou o bloco `variant` ativo) — é assim que `variant` e N eixos de estilo combinam livremente, sem duplicar arquivo por cruzamento. Não dá pra ter dois eixos totalmente estruturais (não existe forma de "somar" dois blocos HTML completos independentes) — por isso só `variant` pode trocar estrutura.

Vale a pena usar `variants/<eixo>/` só quando os valores são conhecidos de antemão e você quer que apareçam como `select` pronto no Storybook — se o eixo aceita qualquer string, sem um conjunto fixo (ex: o `appearance` do `positivus-example-card`, hoje com um valor só), `data-prop-modifier` (ver acima) resolve com menos arquivo.

Cada componente carrega isso com uma linha fixa no `.js` (ver [`component-props.md`](./component-props.md) pro exemplo completo):

```js
const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});
```

- `BaseComponent.parseVariantFiles(variantFiles)`: agrupa o resultado do glob por eixo (a partir do caminho `./variants/<eixo>/<valor>.html`), devolvendo `{ structuralVariants: { compact: '...' }, styleAxes: { size: { large: '...' } } }`.
- `extractPropNames(template, variantFiles)`: além dos `data-prop` do `template`, escaneia também cada bloco de `structuralVariants` (podem ter seus próprios `data-prop`) e inclui `'variant'` (se houver algum bloco estrutural) e o nome de cada eixo de estilo — não precisa declarar nenhum eixo à parte em `static observedAttributes`.
- Internamente, o `constructor` guarda o `template` e os eixos já separados (`#structuralVariants`, `#styleAxes`); toda vez que o Shadow DOM precisa ser montado (na criação, ou quando qualquer atributo de eixo muda), `#selectBaseMarkup()` escolhe o bloco estrutural certo (ou o `template` padrão) e `#applyStyleAxisClasses()` soma as classes de cada eixo de estilo ativo no elemento raiz (`shadowRoot.firstElementChild`) — por isso **todo bloco (padrão ou de `variants/variant/`) precisa ter um único elemento raiz**.
- Se um valor de eixo não existir (atributo ausente, inválido, ou sem arquivo correspondente), aquele eixo cai no padrão (`variant`: usa o `template`; eixo de estilo: nenhuma classe extra).
- Depois de trocar de bloco estrutural, o `BaseComponent` refaz o mapa de `data-prop` (`#bindProps()`) e reaplica todo prop que já estava definido — por isso um `data-prop="title"` presente tanto no `template` quanto num bloco de `variants/variant/` continua funcionando igual, não importa qual está ativo no momento.

Veja [`component-props.md`](./component-props.md) pra convenção completa de props/composição/variantes.

Veja a convenção completa de componentes (estrutura de pastas, nomenclatura, etc.) no [CLAUDE.md](../../CLAUDE.md) na raiz do projeto.
