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
npm run generate:component      # gera .js/.stories.js/.test.js de componentes novos
npm run generate:image-imports  # gera o import das imagens locais de componentes no .js
```

## Estrutura

```
.github/workflows/deploy.yml   # CI: build + deploy no GitHub Pages
.storybook/                    # configuração do Storybook (main.js, preview.js)
vite-plugins/                  # plugins Vite locais (índice/preview de componentes em dev)
cypress/e2e/                   # specs de e2e (*.cy.js)
cypress.config.js
index.html
src/
  main.js                        # registra os componentes usados na página
  styles/                        # reset.css + global.css
  components/
    base-component.js            # classe base (Shadow DOM + adopted stylesheets)
    atoms/                        # elementos indivisíveis
    molecules/
      positivus-example-card/     # exemplo de componente (.html, .css, .js, .stories.js, .test.js, images/)
    organisms/                    # seções completas da página
public/
  favicon.svg
```

## Passo a passo: criando um componente novo

Exemplo criando um componente fictício `positivus-button` como **atom**. Troque o nome/nível pelo componente real que você for criar (veja em [CLAUDE.md](./CLAUDE.md#atomic-design--como-decidir-o-nível-de-um-componente) como decidir entre atom/molecule/organism).

1. **Crie a pasta** `src/components/atoms/positivus-button/` (nome sempre com prefixo `positivus-`).

2. **Markup** — `positivus-button.html`:

   ```html
   <button class="button">
     <slot></slot>
   </button>
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

4. **Classe do componente** — `positivus-button.js`:

   ```js
   import { BaseComponent } from '../../base-component.js';
   import template from './positivus-button.html?raw';
   import styles from './positivus-button.css?inline';

   export class PositivusButton extends BaseComponent {
     constructor() {
       super({ template, styles });
     }
   }

   customElements.define('positivus-button', PositivusButton);
   ```

5. **Story do Storybook** (obrigatória) — `positivus-button.stories.js`:

   ```js
   import './positivus-button.js';

   export default {
     title: 'Atoms/PositivusButton',
     tags: ['autodocs'],
   };

   export const Default = {
     render: () => document.createElement('positivus-button'),
   };
   ```

6. **Teste unitário** (obrigatório) — `positivus-button.test.js`:

   ```js
   import { describe, expect, it } from 'vitest';
   import './positivus-button.js';

   describe('positivus-button', () => {
     it('renders the button markup inside its Shadow DOM', () => {
       const el = document.createElement('positivus-button');
       document.body.append(el);

       expect(el.shadowRoot.querySelector('.button')).not.toBeNull();

       el.remove();
     });
   });
   ```

7. **Registre o componente** em [src/main.js](./src/main.js):

   ```js
   import './components/atoms/positivus-button/positivus-button.js';
   ```

8. **Use a tag** onde precisar (`index.html` ou dentro do `.html` de outro componente):

   ```html
   <positivus-button>Clique aqui</positivus-button>
   ```

9. **Veja funcionando** — rode `npm run dev`. O navegador abre sozinho numa página listando todos os componentes (agrupados por Atoms/Molecules/Organisms); o `positivus-button` já aparece lá assim que o `.html` existir. Clique nele pra ver o preview do HTML/CSS isolado — não precisa criar nenhum arquivo de preview à parte, ele é gerado automaticamente.

10. **Rode os checks** antes de commitar:

    ```bash
    npm run lint
    npm run test
    npm run format
    ```

11. **Commit**, seguindo [Conventional Commits](https://www.conventionalcommits.org/):

    ```bash
    git add src/components/atoms/positivus-button src/main.js
    git commit -m "feat(atoms): adiciona positivus-button"
    ```

## Passo a passo: adicionando uma imagem a um componente

Imagens usadas só por um componente ficam dentro da própria pasta dele, em `images/`. Exemplo de verdade já no projeto: [positivus-example-card](./src/components/molecules/positivus-example-card).

1. **Coloque o arquivo** em `positivus-<nome>/images/<arquivo>` (ex: `positivus-example-card/images/example.svg`).

2. **Use `<img>` normal no `.html`** — sem sintaxe especial:

   ```html
   <img src="./images/example.svg" alt="Descrição da imagem" />
   ```

3. **Rode `npm run generate:image-imports`.** Esse comando lê os `<img src="...">` locais do `.html` e adiciona/atualiza o `import` da imagem no `.js` do componente sozinho — um `src` relativo simples não funciona sozinho aqui (o motivo está detalhado em [CLAUDE.md](./CLAUDE.md#geração-automática-de-imports-de-imagem)). O comando já commita o `.js` alterado; o `.html`/`.css`/`images/` continuam sendo commitados por quem os criou.

4. **Veja funcionando** — tanto no preview de dev (`/__components/<nível>/<nome>`) quanto em `npm run build` + `npm run preview`, já que a imagem passa a ser resolvida como um asset real do Vite nos dois ambientes.

Detalhes de cada regra (nomenclatura, BEM, Atomic Design, commits/branches, deploy, etc.) estão documentados em [CLAUDE.md](./CLAUDE.md).
