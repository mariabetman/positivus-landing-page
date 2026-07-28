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
3. **Se `template` foi passado**, injeta o HTML no Shadow DOM (`shadowRoot.innerHTML`).

## `$(selector)` e `$$(selector)`

Atalhos para `this.shadowRoot.querySelector`/`querySelectorAll` — evitam repetir `this.shadowRoot.` toda vez que uma classe filha precisa achar um elemento dentro do seu próprio markup.

Veja a convenção completa de componentes (estrutura de pastas, nomenclatura, etc.) no [CLAUDE.md](../../CLAUDE.md) na raiz do projeto.
