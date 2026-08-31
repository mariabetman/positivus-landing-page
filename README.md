# Positivus Landing Page

Landing page estática construída apenas com **HTML, CSS e JS puros**, componentizada com **Web Components nativos** (Custom Elements + Shadow DOM). O **Vite** é usado só como dev server/build tool — não há framework de UI.

Site publicado em `https://mariabetman.github.io/positivus-landing-page/`. Convenções completas do projeto em [CLAUDE.md](./CLAUDE.md).

## Stack

- [Vite](https://vitejs.dev/) — dev server e build
- Web Components nativos (sem React/Vue/Angular/Lit), organizados por **Atomic Design** (atoms/molecules/organisms)
- CSS puro, com [Meyer Reset](https://meyerweb.com/eric/tools/css/reset/) (pacote `eric-meyer-reset`)
- [Storybook](https://storybook.js.org/) — documentação/preview isolado dos componentes
- [Vitest](https://vitest.dev/) (unitário) + [Cypress](https://www.cypress.io/) (e2e)
- ESLint + Prettier
- Deploy automático no GitHub Pages via GitHub Actions (a cada push na `main`)

## Passo a passo: baixando e rodando o projeto

Pré-requisito: [Node.js](https://nodejs.org/) (versão LTS mais recente) com `npm` já instalados.

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/mariabetman/positivus-landing-page.git
   cd positivus-landing-page
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Rode o dev server:**

   ```bash
   npm run dev
   ```

   Duas páginas ficam disponíveis:

   - **A landing page** — o site de verdade, na URL que o Vite mostra no terminal (algo como `http://localhost:5173/positivus-landing-page/`). Abra essa URL manualmente numa aba.
   - **A lista de componentes** (`/__components`) — abre sozinha, automaticamente, numa aba separada. É só uma ferramenta de desenvolvimento, não faz parte do site publicado: lista os componentes existentes e mostra o preview isolado de cada um (detalhes em "Passo a passo: criando um componente novo" abaixo).

   Com o servidor rodando, qualquer alteração salva em `src/` atualiza as duas abas sozinha, sem precisar dar refresh (hot reload do Vite).

4. **(Opcional) Veja como fica o build de produção:**

   ```bash
   npm run build     # gera a pasta dist/
   npm run preview   # serve a pasta dist/ localmente, como no ar
   ```

Com o projeto rodando, o próximo passo é abrir/criar um componente — ver "Passo a passo: criando um componente novo" abaixo (que inclui, no fim, como rodar as checagens de lint/teste antes de commitar). Todos os comandos disponíveis estão listados na seção "Comandos" abaixo.

## Comandos

```bash
npm install               # instala dependências
npm run dev               # dev server com hot reload (abre a lista de componentes automaticamente)
npm run build             # build de produção em dist/
npm run preview           # preview do build de produção
npm run lint              # ESLint
npm run format            # Prettier (write)
npm run storybook         # Storybook dev server (http://localhost:6006)
npm run build-storybook   # build estático do Storybook em storybook-static/
npm run test              # testes unitários (Vitest)
npm run e2e               # testes e2e (Cypress), sobe o dev server sozinho
npm run generate:component            # gera .js/.stories.js/.test.js de componentes novos
npm run generate:composition-imports  # gera o import de componentes usados dentro de outro (ou na index.html)
```

## Estrutura

```
.github/workflows/deploy.yml   # CI: build + deploy no GitHub Pages
.storybook/                    # configuração do Storybook (main.js, preview.js)
vite-plugins/                  # plugins Vite locais (índice/preview de componentes em dev)
scripts/                       # geradores de arquivo (generate:component, generate:composition-imports)
cypress/e2e/                   # specs de e2e (*.cy.js)
cypress.config.js
index.html
src/
  main.js                        # registra os componentes usados na página/uns nos outros
  styles/                        # reset.css + global.css
  components/
    base-component.js            # classe base (Shadow DOM + adopted stylesheets + props via atributo)
    base-component.md            # como o BaseComponent funciona por dentro
    component-props.md           # convenção de props (data-prop) e composição, com exemplos
    atoms/                        # elementos indivisíveis
    molecules/
      positivus-example-card/     # exemplo de componente (.html, .css, .js, .stories.js, .test.js)
    organisms/
      positivus-card-list/        # exemplo de composição (usa positivus-example-card dentro)
public/
  favicon.svg
  assets/
    <funcao>/  # logos/, icons/, illustrations/, bgs/... (ver seção de imagens abaixo)
```

## Passo a passo: criando um componente novo

Exemplo criando um componente fictício `positivus-button` como **atom**. Troque o nome/nível pelo componente real que você for criar (veja em [CLAUDE.md](./CLAUDE.md#atomic-design--como-decidir-o-nível-de-um-componente) como decidir entre atom/molecule/organism).

1. **Crie a pasta** `src/components/atoms/positivus-button/` (nome sempre com prefixo `positivus-`).

2. **Markup** — `positivus-button.html`. Marque com `data-prop`/`data-prop-<atributo>` qualquer parte que deva aceitar um valor diferente por uso (texto, link, imagem — ver "Passo a passo: parametrizando um componente com props" abaixo); o que não for marcado fica fixo:

   ```html
   <a class="button" href="#" data-prop-href="link" data-prop="text">Clique aqui</a>
   ```

3. **Estilos** — `positivus-button.css` (classes em BEM, `:host` para o próprio elemento):

   ```css
   :host {
     display: inline-block;
   }

   .button {
     padding: 0.5rem 1rem;
   }
   ```

4. **Rode `npm run generate:component`.** Gera `positivus-button.js`, `positivus-button.stories.js` e `positivus-button.test.js` sozinho, a partir do `.html`/`.css` que você criou — não precisa escrever esses três arquivos na mão. O `.js` gerado já sai assim:

   ```js
   import { BaseComponent } from '../../base-component.js';
   import template from './positivus-button.html?raw';
   import styles from './positivus-button.css?inline';

   export class PositivusButton extends BaseComponent {
     static observedAttributes = BaseComponent.extractPropNames(template);

     constructor() {
       super({ template, styles });
     }
   }

   customElements.define('positivus-button', PositivusButton);
   ```

   A `static observedAttributes` é o que faz os `data-prop`/`data-prop-<atributo>` do passo 2 funcionarem — ela é calculada automaticamente a partir do `.html`, não precisa editar isso na mão nunca.

5. **Complemente o teste gerado** (ele sai mínimo, só confirmando que a tag foi registrada) — ex: testar que o link/texto padrão aparece, e que passar `link="..."` via atributo troca o `href` de verdade. A **story** já sai pronta com as props do componente aparecendo como controles editáveis no painel Controls do Storybook (ver "Passo a passo: parametrizando..." abaixo) — normalmente só precisa adicionar mais uma story com um `args` diferente, mostrando um uso customizado (ver `CustomContent` no [`positivus-example-card`](./src/components/molecules/positivus-example-card/positivus-example-card.stories.js) como exemplo).

6. **Use a tag** onde precisar — `index.html`, ou dentro do `.html` de outro componente:

   ```html
   <positivus-button link="https://exemplo.com" text="Fale conosco"></positivus-button>
   ```

7. **Rode `npm run generate:composition-imports`.** Esse comando varre onde a tag foi usada (na `index.html` ou dentro de outro componente) e adiciona o `import` que falta sozinho — em `src/main.js`, ou no `.js` do componente que usou a tag. Não precisa editar `main.js` na mão.

8. **Veja funcionando** — rode `npm run dev`. O navegador abre sozinho numa página listando todos os componentes (agrupados por Atoms/Molecules/Organisms); o `positivus-button` já aparece lá assim que o `.html` existir. Clique nele pra ver o preview do HTML/CSS isolado — não precisa criar nenhum arquivo de preview à parte, ele é gerado automaticamente. A `index.html` real (fora do `/__components`) também já mostra o componente funcionando com os props passados no passo 6.

9. **Rode os checks** antes de commitar:

   ```bash
   npm run lint
   npm run test
   npm run format
   ```

10. **Commit**, seguindo [Conventional Commits](https://www.conventionalcommits.org/) (os passos 4 e 7 já criaram commits próprios sozinhos — falta só commitar o que você escreveu na mão):

    ```bash
    git add src/components/atoms/positivus-button index.html
    git commit -m "feat(atoms): adiciona positivus-button"
    ```

## Passo a passo: parametrizando um componente com props

Qualquer componente pode receber texto/atributo customizado via atributo HTML, sem escrever nenhum JavaScript — quem cria o componente só marca no `.html` (ver passo 2 acima); quem usa passa o valor na tag. Convenção completa, com todos os casos (imagem, link, atributo booleano), em [`src/components/component-props.md`](./src/components/component-props.md). Resumo rápido:

```html
<!-- no .html do componente -->
<h2 data-prop="title">Título padrão</h2>
<img data-prop-src="image" data-prop-alt="image-alt" src="..." alt="..." />
<button data-prop-toggle-disabled="is-disabled">Enviar</button>
```

```html
<!-- usando o componente -->
<positivus-x title="Outro título" image="./assets/icons/seta-direita.svg" is-disabled="true">
</positivus-x>
```

- `data-prop="nome"` → vira o texto do elemento.
- `data-prop-<atributo>="nome"` → vira aquele atributo do elemento (`src`, `href`, `alt`, `aria-label`, etc.) — `nome` é um apelido, não precisa ser igual ao `<atributo>`.
- `data-prop-toggle-<atributo>="nome"` → variante pra atributo booleano (`disabled`, `checked`...).
- Nome do prop sempre em **kebab-case** (`is-disabled`, não `isDisabled`) — atributo HTML é case-insensitive.

## Passo a passo: usando um componente dentro de outro (composição)

Não tem sintaxe nova — escreva a tag normalmente dentro do `.html` de outro componente (ou da `index.html`), passando prop se quiser, e depois rode `npm run generate:composition-imports` (ver passo 7 acima). Exemplo de verdade já no projeto: [`positivus-card-list`](./src/components/organisms/positivus-card-list), que usa `positivus-example-card` três vezes dentro do próprio `.html`.

## Variantes de um componente (HTML diferente, não só CSS)

Uma variação só de estilo tem duas opções, dependendo se os valores possíveis são conhecidos de antemão: atributo simples + `:host([tone="..."])` no CSS (qualquer valor, mas não vira classe sozinho), ou `data-prop-modifier="nome"` (qualquer valor vira `<classe-base>--<valor>` na `classList` sozinho, ver [`component-props.md`](./src/components/component-props.md)). Quando a variante precisa de **HTML diferente** de verdade, o componente ganha uma pasta `variants/<eixo>/<valor>.html` — `variant` é o único eixo que pode trocar a estrutura inteira; qualquer outro eixo é só uma classe modificadora (arquivo por valor, aparece como `select` no Storybook), e os dois combinam livremente em runtime. Exemplo de verdade já no projeto: [`positivus-example-card`](./src/components/molecules/positivus-example-card/positivus-example-card.html) — `.html` principal = default, `variants/variant/compact.html` troca a estrutura (sem imagem); já o `appearance` (`highlight`) usa `data-prop-modifier`, não `variants/`, já que só tem um valor não-padrão:

```html
<positivus-example-card variant="compact" appearance="highlight" title="Newsletter" text="Receba novidades por e-mail.">
</positivus-example-card>
```

Variantes estruturais (`variant`) ficam em `variants/variant/<valor>.html`, cada uma no seu próprio arquivo (fácil de achar/editar), e `npm run generate:component` já gera uma story por valor não-padrão sozinho — inclusive pra um componente que já existia antes de ganhar `variants/`: rode o comando de novo depois de adicionar um arquivo novo lá, e ele acrescenta só a story que falta no `.stories.js` que já existe (ver o formato em `Compact`, no [`positivus-example-card.stories.js`](./src/components/molecules/positivus-example-card/positivus-example-card.stories.js)). `npm run dev` também mostra todas as combinações automaticamente no preview do componente.

## Passo a passo: adicionando uma imagem a um componente

Imagens ficam em `public/assets/<funcao>/<arquivo>` — organizadas pelo que a imagem **é** (`logos/`, `icons/`, `illustrations/`, `bgs/`...), não por qual componente usa — assim a mesma imagem pode ser reaproveitada por mais de um componente sem duplicar arquivo. Estrutura plana dentro de cada pasta de função (sem subpasta por componente), então o nome do arquivo precisa ser único ali dentro. Exemplos de verdade já no projeto: [`public/assets/logos`](./public/assets/logos) e [`public/assets/illustrations`](./public/assets/illustrations).

1. **Coloque o arquivo** em `public/assets/<funcao>/<arquivo>` (ex: `public/assets/icons/seta-direita.svg`) — use uma pasta de função já existente, ou crie uma nova só se nenhuma existente descrever a imagem.

2. **Use `<img>` normal no `.html`**, com caminho relativo — sem `import`, sem rodar nenhum script:

   ```html
   <img src="./assets/icons/seta-direita.svg" alt="Descrição da imagem" />
   ```

   Isso já funciona sozinho, em dev e depois do `npm run build` — `public/` é copiado por inteiro pro `dist/`, no mesmo caminho (ver [CLAUDE.md](./CLAUDE.md#imagens-em-publicassets) pro porquê).

3. **Se quiser deixar a imagem parametrizável** (trocável por quem usa o componente), marque com `data-prop-src`/`data-prop-alt` (ver "Passo a passo: parametrizando um componente com props" acima) — o valor passado via atributo já é o caminho final, sem processamento extra.

4. **Veja funcionando** — tanto no preview de dev (`/__components/<nível>/<nome>`) quanto em `npm run build` + `npm run preview`.

Detalhes de cada regra (nomenclatura, BEM, Atomic Design, commits/branches, deploy, etc.) estão documentados em [CLAUDE.md](./CLAUDE.md).
