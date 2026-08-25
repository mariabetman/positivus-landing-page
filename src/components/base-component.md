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

## O que o `super(...)` faz

1. **`attachShadow({ mode: 'open' })`** — cria o Shadow DOM do elemento, isolando seu markup e CSS do resto da página.
2. **Se `styles` foi passado**, aplica o CSS ao Shadow DOM via *constructable stylesheet* (`CSSStyleSheet` + `adoptedStyleSheets`), em vez de uma tag `<style>` no template — permite que o mesmo CSS já parseado seja reaproveitado por várias instâncias do componente.
3. **Se `template` foi passado**, injeta o HTML no Shadow DOM (`shadowRoot.innerHTML`) — o template inteiro, exceto quando ele tem `data-variant` (ver seção própria abaixo), caso em que só o bloco da variante ativa é injetado.

## `$(selector)` e `$$(selector)`

Atalhos para `this.shadowRoot.querySelector`/`querySelectorAll` — evitam repetir `this.shadowRoot.` toda vez que uma classe filha precisa achar um elemento dentro do seu próprio markup.

## `data-prop`, `static extractPropNames` e `attributeChangedCallback`

`BaseComponent` também é responsável por deixar um componente receber conteúdo customizado via atributo (prop), sem nenhum JS por componente. A regra é uma só, e vale pra qualquer atributo HTML de qualquer elemento:

- `data-prop="nome"` (sem sufixo) → aplica o valor em `textContent` do elemento.
- `data-prop-<atributo>="nome"` (com sufixo) → aplica o valor via `setAttribute('<atributo>', valor)` — funciona pra `src`, `alt`, `href`, `aria-label`, ou qualquer outro atributo padrão de HTML, sem o `BaseComponent` precisar conhecer o tipo do elemento.
- `data-prop-toggle-<atributo>="nome"` → variante pra atributo **booleano** (`disabled`, `checked`, `required`, `hidden`...): aplica via `toggleAttribute('<atributo>', valor === 'true')`, decidindo se o atributo existe ou não — diferente do `data-prop-<atributo>` normal, que só seta o valor (e não resolveria booleano certo, ver "Limitações conhecidas" abaixo).

```html
<img class="card__image" src="..." data-prop-src="image" data-prop-alt="image-alt" />
<a class="card__link" href="#" data-prop-href="link">Saiba mais</a>
<h2 class="card__title" data-prop="title">Example Card</h2>
<button class="card__button" data-prop-toggle-disabled="is-disabled">Enviar</button>
```

**Nome do prop sempre em kebab-case** (ex: `is-disabled`, não `isDisabled`): o valor de `data-prop`/`data-prop-<atributo>`/`data-prop-toggle-<atributo>` se torna o nome de um atributo HTML real (`<positivus-x is-disabled="true">`), e atributos HTML são *case-insensitive* — `element.setAttribute('isDisabled', ...)` vira `isdisabled` (tudo minúsculo) na hora, então um prop com letra maiúscula no nome nunca bateria com o que `static observedAttributes` espera, e o `attributeChangedCallback` nunca dispararia pra ele.

```js
export class PositivusExampleCard extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}
```

- `BaseComponent.extractPropNames(template)`: lê os nomes de `data-prop`/`data-prop-<atributo>` presentes na string do template. Usado pra declarar `static observedAttributes` — obrigatório pro navegador saber quais atributos observar e disparar `attributeChangedCallback`. Todo componente gerado por `npm run generate:component` já sai com essa linha.
- No `constructor`, depois de montar o `shadowRoot.innerHTML`, o `BaseComponent` varre todo elemento do Shadow DOM procurando atributos que comecem com `data-prop` e guarda um mapa nome do prop → `{ elemento, alvo }` (`alvo` é `null` pro `data-prop` sem sufixo — sinal interno de "aplique em `textContent`" —, ou o nome do atributo pro `data-prop-<atributo>`).
- `attributeChangedCallback(name)` aplica o valor no elemento mapeado — chamado automaticamente pelo navegador, tanto pro valor inicial (se o atributo já vier preenchido no HTML) quanto pra mudanças depois.
- Um mesmo elemento pode ter vários props ao mesmo tempo, cada um com seu próprio nome (ex: `data-prop-src="image"` + `data-prop-alt="image-alt"` no mesmo `<img>`) — não tem limite de quantos atributos diferentes um elemento aceita.

**Limitações conhecidas** (nenhuma bloqueia o uso atual do projeto, mas vale saber):
- **Conteúdo rico ou outro componente como "valor"** (não uma string) não é coberto por `data-prop` — um atributo HTML só carrega texto. Pra isso, a única forma seria slot (mecanismo descartado neste projeto, ver `component-props.md`).
- **Reatividade de formulário** (`value`/`checked` de `<input>`, que representam o estado *atual*, não só o padrão) tende a exigir a propriedade do DOM em vez de `setAttribute` — não é um caso usado no projeto ainda. Também não existe hoje nenhuma forma de levar dado de dentro do componente pra fora (ex: o que o usuário digitou) — isso exigiria eventos customizados (`dispatchEvent`), um mecanismo diferente do `data-prop` (que só leva dado de fora pra dentro).
- **`data-prop-text="nome"` é um caso válido e seguro** — aplica o valor via `setAttribute('text', valor)`, útil quando o elemento marcado é a tag de outro componente que espera um atributo `text` de verdade (ex: compor `<positivus-button data-prop-text="button-text">` dentro de outro `.html`). Internamente isso já não colide mais com o sinal de "sem sufixo" (`data-prop="nome"`, que usa `alvo === null`, não a string `'text'`) — antes dessa distinção existir, os dois casos ficavam indistinguíveis e `data-prop-text` acabava indevidamente virando `textContent` em vez de `setAttribute('text', ...)`.

## `data-variant`, `static extractVariantAxes` e múltiplos eixos de variante

Quando um componente precisa de **HTML** diferente por variante (não só CSS), o `.html` pode ter mais de um bloco, cada um marcado com `data-variant="nome"`. O `BaseComponent` renderiza só o bloco correspondente ao atributo `variant` da tag — os outros nunca chegam a existir no Shadow DOM (não é `display: none`, é o JS simplesmente não montando aquele bloco):

```html
<div class="card" data-variant="default">...</div>
<div class="card card--compact" data-variant="compact">...</div>
```

A classe de bloco (`card`) é a mesma nas duas — a variante não padrão acrescenta um modificador BEM (`card--compact`), não cria um bloco novo; ver [`component-props.md`](./component-props.md) pro exemplo completo.

Um componente pode ter mais de um **eixo** de variante independente e combinável — o eixo sem sufixo continua se chamando `variant`; eixos extras usam `data-variant-<eixo>="valor"` no mesmo elemento que já tem `data-variant` (mesma relação que já existe entre `data-prop` e `data-prop-<atributo>`):

```html
<div class="card" data-variant="default" data-variant-tone="default">...</div>
<div class="card card--highlight" data-variant="default" data-variant-tone="highlight">...</div>
<div class="card card--compact" data-variant="compact" data-variant-tone="default">...</div>
<div class="card card--compact card--highlight" data-variant="compact" data-variant-tone="highlight">...</div>
```

```html
<positivus-example-card variant="compact" tone="highlight"></positivus-example-card>
```

- `BaseComponent.extractVariantAxes(template)`: lê os eixos (`data-variant`/`data-variant-<eixo>`) presentes no template, agrupados por eixo, devolvendo `[{ name, values }]` — `values` na ordem em que aparecem, o **primeiro** é o padrão daquele eixo, usado quando a tag não recebe o atributo correspondente, ou recebe um valor que não existe no `.html`.
- `extractPropNames(template)` (a mesma função de sempre) já inclui o nome de cada eixo encontrado (`variant`, `tone`...) na lista — não precisa declarar nenhum eixo à parte em `static observedAttributes`.
- Internamente, o `constructor` guarda o `template` bruto e os eixos encontrados (`#variantAxes`); toda vez que o Shadow DOM precisa ser montado (na criação, ou quando qualquer atributo de eixo muda), um `#selectVariantMarkup()` privado resolve o valor ativo de cada eixo (com o mesmo fallback pro padrão daquele eixo, individualmente) e procura, entre todos os `[data-variant]`, o único bloco cujos atributos batem com **todos** os eixos ao mesmo tempo — usa o `outerHTML` dele; o restante do template nunca é injetado. Se a combinação pedida não existir como bloco escrito no `.html`, cai no primeiro bloco encontrado.
- Cada combinação de valores é um bloco HTML completo e explícito — não há geração dinâmica de fragmentos. Isso custa duplicação combinatória (2 eixos × 2 valores = 4 blocos), então esse mecanismo é recomendado só até ~2 eixos com poucos valores; ver a alternativa de atributo simples + `:host([attr])` em [`component-props.md`](./component-props.md) pra variação puramente visual.
- Depois de trocar de bloco, o `BaseComponent` refaz o mapa de `data-prop` (`#bindProps()`) e reaplica todo prop que já estava definido — por isso um `data-prop="title"` presente em **mais de um** bloco de variante continua funcionando igual, não importa qual combinação está ativa no momento (útil quando várias variantes compartilham um mesmo campo, tipo título).

Veja [`component-props.md`](./component-props.md) pra convenção completa de props/composição/variantes.

Veja a convenção completa de componentes (estrutura de pastas, nomenclatura, etc.) no [CLAUDE.md](../../CLAUDE.md) na raiz do projeto.
