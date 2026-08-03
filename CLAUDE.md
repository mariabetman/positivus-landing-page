# Positivus Landing Page

Landing page estática construída apenas com **HTML, CSS e JS puros** (sem frameworks como React/Vue/Angular). Usa **Vite** somente como dev server/build tool.

## Stack

- **Build tool:** Vite (`npm run dev`, `npm run build`, `npm run preview`)
- **Componentização:** Web Components nativos (Custom Elements + Shadow DOM), sem framework
- **Estilo:** CSS puro (sem pré-processador)
- **Lint/format:** ESLint (flat config) + Prettier
- **Documentação de componentes:** Storybook (`npm run storybook`)
- **Testes:** Vitest (unitário, `npm run test`) + Cypress (e2e, `npm run e2e`)

## Comandos

```bash
npm install       # instala dependências
npm run dev       # dev server com hot reload
npm run build     # build de produção em dist/
npm run preview   # preview do build de produção
npm run lint      # ESLint
npm run format    # Prettier (write)
npm run storybook        # Storybook dev server (http://localhost:6006)
npm run build-storybook  # build estático do Storybook em storybook-static/
npm run test             # testes unitários (Vitest), roda uma vez e sai
npm run test:watch       # testes unitários em modo watch
npm run e2e              # testes e2e (Cypress), sobe o dev server sozinho
npm run cypress:open     # abre o Cypress interativo (precisa do `npm run dev` já rodando)
```

## Estrutura de pastas

```
.storybook/              # configuração do Storybook (main.js, preview.js)
vite-plugins/            # plugins Vite locais (ex: índice/preview de componentes em dev)
cypress/
  e2e/                   # specs de e2e (*.cy.js)
cypress.config.js        # configuração do Cypress (baseUrl, etc.)
index.html               # ponto de entrada, registra as tags customizadas
src/
  main.js                 # importa/registra todos os componentes
  styles/
    reset.css               # @import do pacote eric-meyer-reset (Meyer Reset v2.0), antes do global.css
    global.css              # estilos globais/.container
  components/
    base-component.js       # classe base: Shadow DOM + adopted stylesheets
    atoms/                   # elementos indivisíveis (ex: botão, input, ícone)
      <nome-do-componente>/
        <nome-do-componente>.html
        <nome-do-componente>.js
        <nome-do-componente>.css
        <nome-do-componente>.stories.js
        <nome-do-componente>.test.js
    molecules/               # combinação de poucos atoms com uma única responsabilidade (ex: card, form-group)
      <nome-do-componente>/
        ...
    organisms/               # seções completas da página, compostas por molecules/atoms (ex: header, footer, hero)
      <nome-do-componente>/
        ...
public/
  favicon.svg
```

Ainda não existem pastas `templates/` (layout de página combinando organisms) nem `pages/` (instância de uma página) — o projeto é uma landing page de página única. Criar essas pastas apenas quando houver necessidade real (ex: o site virar multi-página ou surgir mais de um layout).

## Atomic Design — como decidir o nível de um componente

- **atoms**: não depende de outro componente do projeto; é o menor bloco reutilizável (botão, input, badge, ícone).
- **molecules**: combina atoms (ou só HTML simples) para resolver uma única responsabilidade (ex: um card com título + texto, um item de navegação).
- **organisms**: combina molecules/atoms para formar uma seção completa e independente da página (ex: cabeçalho, rodapé, hero).

Na dúvida entre dois níveis, prefira o nível mais simples que descreva o componente — é mais fácil promover um componente de `molecules` para `organisms` depois do que forçar uma composição complexa antes da hora.

## Convenção para novos componentes

Cada componente é isolado em sua própria pasta dentro do nível correto (`atoms/`, `molecules/` ou `organisms/`). O nome da pasta e dos arquivos é sempre o nome completo da tag, já com o prefixo `positivus-` (ex: pasta/arquivos `positivus-example-card`):

1. Crie `src/components/<nivel>/positivus-<nome>/positivus-<nome>.html` com o markup do componente.
2. Crie `src/components/<nivel>/positivus-<nome>/positivus-<nome>.css` com os estilos (usa `:host` para o próprio elemento).
3. Crie `src/components/<nivel>/positivus-<nome>/positivus-<nome>.js`:
   ```js
   import { BaseComponent } from '../../base-component.js';
   import template from './positivus-<nome>.html?raw';
   import styles from './positivus-<nome>.css?inline';

   export class PositivusNomeDoComponente extends BaseComponent {
     constructor() {
       super({ template, styles });
     }
   }

   customElements.define(
     'positivus-nome-do-componente',
     PositivusNomeDoComponente,
   );
   ```
4. Crie `src/components/<nivel>/positivus-<nome>/positivus-<nome>.stories.js` com pelo menos uma story `Default` (ver seção Storybook abaixo) — obrigatório para todo componente novo.
5. Crie `src/components/<nivel>/positivus-<nome>/positivus-<nome>.test.js` com pelo menos um teste unitário (ver seção Testes abaixo) — obrigatório para todo componente novo.
6. Importe o arquivo `.js` do componente em `src/main.js`.
7. Use a tag customizada diretamente no `index.html` (ex: `<positivus-example-card></positivus-example-card>`).

Não é preciso criar nenhum arquivo de preview manualmente — rodando `npm run dev`, o preview do HTML/CSS do componente é gerado automaticamente (ver "Preview automático de componentes" abaixo).

Regras:

- Nome da tag customizada sempre com hífen e prefixado com `positivus-` (ex: `positivus-example-card`), exigência da spec de Custom Elements + convenção do projeto.
- Nome da classe JS sempre prefixado com `Positivus` (ex: `PositivusExampleCard`), em PascalCase.
- Identificadores de código (variáveis, funções, classes JS, tags) sempre em inglês, com nomes descritivos.
- Classes CSS usadas no markup dos componentes seguem **BEM** (`Block__Element--Modifier`): o bloco é o nome do componente sem o prefixo `positivus-` (ex: `card`), elementos com `__` (ex: `card__title`), modificadores com `--` (ex: `card--highlighted`). Evitar seletor de tag (`h2`, `p`) no CSS do componente — sempre uma classe BEM.
- Comentários e documentação (JSDoc, README, CLAUDE.md, etc.) sempre em pt-BR, independente do idioma do código.
- O HTML do componente fica em um arquivo `.html` separado, importado no `.js` via `?raw` (Vite) — não usar template literal inline para markup.
- Estilos ficam encapsulados no Shadow DOM via `adoptedStyleSheets` (import `?inline` do CSS) — evita vazamento de estilo entre componentes.
- Não introduzir frameworks/bibliotecas de componentes (React, Lit, etc.) — a arquitetura é Web Components nativos por decisão do projeto.

## Preview automático de componentes (modo dev)

Não existe (nem precisa criar) um arquivo `.preview.html` por componente. Ao rodar `npm run dev`, o navegador abre automaticamente uma página listando todos os componentes existentes, agrupados por Atoms/Molecules/Organisms; clicar em um deles abre o preview do HTML/CSS do componente, montado na hora a partir do `.html`/`.css` reais.

- Tudo implementado em `vite-plugins/positivus-dev-component-index.js`, um plugin Vite ativo só em modo dev (`apply: 'serve'`) — não roda no `vite build`, não afeta o site publicado nem o `index.html` real.
- Rotas servidas só em dev:
  - `/__components` → lista os componentes (varre `src/components/<nivel>/positivus-<nome>/` procurando pastas com um `<nome>.html`).
  - `/__components/<nivel>/<nome>` → preview do componente: lê o `.html`/`.css` do disco e monta um Shadow DOM de verdade via `<script>` (`attachShadow` + `<style>` com o CSS do componente) — a regra `:host { ... }` funciona igual funcionaria no componente real. `reset.css`/`global.css` são carregados globalmente (fora do Shadow DOM), como em qualquer página.
- Tudo é lido do disco a cada requisição — criar um componente novo ou editar seu `.html`/`.css` já reflete com um refresh na página, sem precisar reiniciar o `npm run dev`.
- `vite.config.js` define `server.open: '__components'` pra abrir a página de lista automaticamente ao rodar `npm run dev`.

## Storybook

Cada componente tem uma story co-localizada na sua própria pasta (`positivus-<nome>.stories.js`), obrigatória para todo componente novo (ver "Convenção para novos componentes" acima).

```js
// src/components/molecules/positivus-example-card/positivus-example-card.stories.js
import './positivus-example-card.js';

export default {
  title: 'Molecules/PositivusExampleCard', // agrupa por nível atômico: Atoms/Molecules/Organisms
  tags: ['autodocs'],
};

export const Default = {
  render: () => document.createElement('positivus-example-card'),
};
```

Regras:

- `title` sempre no formato `<Nível>/<NomeDaClasse>` (ex: `Atoms/PositivusButton`), pra manter a navegação do Storybook alinhada com Atomic Design.
- Como os componentes são Custom Elements nativos (sem Lit), o `render` de cada story cria e retorna o elemento via `document.createElement('positivus-<nome>')` (ou monta um container com `innerHTML`, se precisar passar atributos/slots).
- `.storybook/main.js` e `.storybook/preview.js` configuram o Storybook para usar o Vite (`@storybook/web-components-vite`) e carregar `reset.css` + `global.css` globalmente.
- `storybook-static/` (saída de `npm run build-storybook`) é ignorada no git, assim como `dist/`.

## Testes

O projeto tem duas camadas de teste, com responsabilidades diferentes:

### Unitário (Vitest)

Cada componente tem um teste unitário co-localizado na sua própria pasta (`positivus-<nome>.test.js`), obrigatório para todo componente novo (ver "Convenção para novos componentes" acima). Roda em `jsdom` (ambiente de browser simulado em Node), configurado em `vite.config.js` (bloco `test`).

```js
// src/components/molecules/positivus-example-card/positivus-example-card.test.js
import { describe, expect, it } from 'vitest';
import './positivus-example-card.js';

describe('positivus-example-card', () => {
  it('renders the card markup inside its Shadow DOM', () => {
    const el = document.createElement('positivus-example-card');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__title').textContent).toBe(
      'Example Card',
    );

    el.remove();
  });
});
```

Regras:

- `describe`/`it`/`expect` sempre importados explicitamente de `'vitest'` (o projeto usa `test.globals: false`, o padrão) — evita depender de globals implícitos e não exige configuração extra no ESLint.
- Teste cria a instância do componente via `document.createElement('positivus-<nome>')` e verifica o conteúdo do `shadowRoot` — nunca testar detalhes internos do `BaseComponent` (isso já é coberto pelos testes dos componentes que o usam).
- `include: ['src/**/*.test.js']` em `vite.config.js` — só arquivos dentro de `src/` são considerados testes unitários.

### E2E (Cypress)

Specs ficam em `cypress/e2e/*.cy.js`, testando a página real (`index.html`) rodando no dev server, não componentes isolados (isso é papel do Vitest/Storybook).

```js
// cypress/e2e/home.cy.js
describe('Home page', () => {
  it('renders the example card', () => {
    cy.visit('/');
    cy.get('positivus-example-card').should('exist');
    cy.get('.card__title').should('contain.text', 'Example Card');
  });
});
```

Regras:

- `cypress.config.js` tem `includeShadowDom: true` — sem isso, `cy.get()` não consegue enxergar elementos dentro do Shadow DOM dos componentes.
- `baseUrl` já inclui o `base` do Vite (`http://localhost:5173/positivus-landing-page/`) — `cy.visit('/')` resolve relativo a esse `baseUrl`.
- `supportFile: false` — o projeto não usa comandos customizados/hooks globais do Cypress ainda; adicionar `cypress/support/e2e.js` só quando houver necessidade real.
- `npm run e2e` usa `start-server-and-test` pra subir o dev server, esperar o `baseUrl` responder, rodar o Cypress headless e derrubar o server sozinho — não precisa deixar `npm run dev` rodando à parte. Pra debugar interativamente, use `npm run cypress:open` (aí sim com o dev server já rodando em outro terminal).
- `eslint.config.js` aplica o `eslint-plugin-cypress` (config `recommended`) só nos arquivos `cypress/**` e `cypress.config.js`, pra reconhecer `cy`/`Cypress`/`describe`/`it` como globals sem precisar declará-los na mão.

## Deploy (GitHub Pages)

Push na branch `main` dispara `.github/workflows/deploy.yml`, que roda lint, build (`npm run build`) e publica o conteúdo de `dist/` no GitHub Pages.

- URL: `https://mariabetman.github.io/positivus-landing-page/`.
- `vite.config.js` define `base: '/positivus-landing-page/'` (necessário por ser uma _project page_, não uma _user page_) — atualizar se o repositório for renomeado.
- Assets de `public/` são referenciados com caminho relativo no `index.html` (ex: `href="./favicon.svg"`), o que funciona com qualquer `base` sem precisar hardcodar o prefixo.
- Pré-requisito manual único, feito uma vez nas configurações do repositório: em _Settings → Pages → Build and deployment → Source_, selecionar **GitHub Actions**.

## Convenção de commits (Conventional Commits)

Mensagens de commit no formato `<tipo>(<escopo opcional>): <descrição curta>`, por exemplo `feat(molecules): adiciona example-card`.

Tipos aceitos:

- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: mudanças só em documentação (README, CLAUDE.md, etc.)
- `style`: formatação, espaçamento, ponto e vírgula etc. (sem mudança de lógica)
- `refactor`: mudança de código que não corrige bug nem adiciona feature
- `perf`: melhoria de performance
- `test`: adição/ajuste de testes
- `build`: mudanças no build (Vite, dependências)
- `ci`: mudanças em pipelines/CI
- `chore`: outras tarefas de manutenção (ex: configs, .gitignore)

## Convenção de branches

Branches seguem o mesmo prefixo do tipo de commit predominante: `<tipo>/<descricao-curta-em-kebab-case>`.

Exemplos: `feat/hero-section`, `fix/nav-overlap`, `chore/eslint-config`, `docs/readme-setup`.

## Como o Claude deve trabalhar neste projeto

- **Sempre perguntar antes de fazer mudanças estruturais** (criar/mover pastas, novos componentes, alterar convenções) — apresentar o plano e esperar confirmação antes de executar.
- Não adicionar tooling, dependências ou automações (ex: husky, commitlint, CI) que não tenham sido pedidas explicitamente.
- Nunca adicionar comentários explicando o porquê de uma mudança — só adicionar comentário se for estritamente necessário por algum outro motivo.
