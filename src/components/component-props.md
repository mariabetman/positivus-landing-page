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
    src="./assets/molecules/positivus-example-card/example.svg"
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
Hoje as imagens ficam em `public/assets/<nivel>/positivus-<nome>/<arquivo>`
(ver "Imagens em `public/assets`" no [`CLAUDE.md`](../../CLAUDE.md)), que o
Vite copia como está pro `dist/`, com caminho estável — então o valor de um
prop de imagem já é o caminho final, sem nenhum processamento:

```html
<positivus-card icon="./assets/molecules/positivus-card/icone-alternativo.png">
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
