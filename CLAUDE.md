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
npm run generate:component     # gera .js/.stories.js/.test.js de componentes novos
npm run generate:composition-imports # gera o import de componentes usados dentro de outro (ou na index.html)
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
    global.css              # estilos globais/.container, também adotado dentro do Shadow DOM de todo componente (ver base-component.js)
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
  assets/
    <funcao>/  # ex: logos/, icons/, illustrations/, bgs/ — ver "Imagens em public/assets" abaixo
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
     static observedAttributes = BaseComponent.extractPropNames(template);

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

Se o componente precisa aceitar texto/imagem customizados (prop) ou usar a tag de outro componente já existente dentro do próprio `.html`, ver ["Props e composição de componentes"](#props-e-composição-de-componentes) abaixo.

Não é preciso criar nenhum arquivo de preview manualmente — rodando `npm run dev`, o preview do HTML/CSS do componente é gerado automaticamente (ver "Preview automático de componentes" abaixo).

Os passos 3–5 (`.js`, `.stories.js`, `.test.js`) também não precisam ser criados manualmente: depois de criar o `.html`/`.css`, rode `npm run generate:component` (ver "Geração automática de arquivos de componente" abaixo) pra gerar os 3 arquivos automaticamente, caso ainda não existam. Continuam manuais só os passos 1–2 (html/css) — o passo 6/7 (importar em `src/main.js`/usar a tag no `index.html`) fica automático quando a tag já está em uso em outro `.html` ou na `index.html`, rodando `npm run generate:composition-imports`.

Regras:

- Nome da tag customizada sempre com hífen e prefixado com `positivus-` (ex: `positivus-example-card`), exigência da spec de Custom Elements + convenção do projeto.
- Nome da classe JS sempre prefixado com `Positivus` (ex: `PositivusExampleCard`), em PascalCase.
- Identificadores de código (variáveis, funções, classes JS, tags) sempre em inglês, com nomes descritivos.
- Classes CSS usadas no markup dos componentes seguem **BEM** (`Block__Element--Modifier`): o bloco é o nome do componente sem o prefixo `positivus-` (ex: `card`), elementos com `__` (ex: `card__title`), modificadores com `--` (ex: `card--highlighted`). Evitar seletor de tag (`h2`, `p`) no CSS do componente — sempre uma classe BEM.
- Comentários e documentação (JSDoc, README, CLAUDE.md, etc.) sempre em pt-BR, independente do idioma do código.
- O HTML do componente fica em um arquivo `.html` separado, importado no `.js` via `?raw` (Vite) — não usar template literal inline para markup.
- Estilos ficam encapsulados no Shadow DOM via `adoptedStyleSheets` (import `?inline` do CSS) — evita vazamento de estilo entre componentes.
- Não introduzir frameworks/bibliotecas de componentes (React, Lit, etc.) — a arquitetura é Web Components nativos por decisão do projeto.
- Imagens usadas por um componente ficam em `public/assets/<funcao>/`, referenciadas no `.html` com caminho relativo (`<img src="./assets/<funcao>/<arquivo>">`) — ver "Imagens em public/assets" abaixo.

## Props e composição de componentes

Todo componente pode receber conteúdo customizado via atributo (prop) e usar a tag de outro componente já existente dentro do próprio `.html` — sem escrever JavaScript pra isso. Convenção completa, com exemplos, em [`src/components/component-props.md`](src/components/component-props.md). Resumo:

- **Prop de texto ou de qualquer atributo**: marque o elemento com `data-prop="nome"` (sem sufixo → vira `textContent`), `data-prop-<atributo>="nome"` (com sufixo → vira aquele atributo via `setAttribute`, funciona pra `src`, `alt`, `href`, `aria-label`, etc.) ou `data-prop-toggle-<atributo>="nome"` (atributo booleano — `disabled`, `checked`... — via `toggleAttribute`, interpretando o valor como `"true"`/`"false"`) no `.html` do componente; quem usa passa `<positivus-x nome="valor">`. Nome do prop sempre em kebab-case (atributo HTML é case-insensitive). O `BaseComponent` resolve isso sozinho (ver `src/components/base-component.md`) — nenhum componente escreve esse JS à mão.
- **Imagem como prop**: como imagens moram em `public/assets/` (ver "Imagens em public/assets" abaixo), o valor do atributo já é o caminho final — sem `import`, sem script, sem cuidado extra. Ex: `<positivus-x icon="./assets/icons/seta.svg">`.
- **Composição** (tag de um componente dentro do `.html` de outro, ou direto na `index.html`): escreva a tag normalmente, depois rode `npm run generate:composition-imports` (ver "Geração automática de imports de composição" abaixo) pra garantir que o `.js` daquele componente seja carregado.
- **Variação visual** (ex: `variant="secondary"`, não é texto/imagem): atributo simples + `:host([variant="secondary"])` no CSS do próprio componente — não usa `data-prop`.

## Preview automático de componentes (modo dev)

Não existe (nem precisa criar) um arquivo `.preview.html` por componente. Ao rodar `npm run dev`, o navegador abre automaticamente uma página listando todos os componentes existentes, agrupados por Atoms/Molecules/Organisms; clicar em um deles abre o preview do HTML/CSS do componente, montado na hora a partir do `.html`/`.css` reais.

- Tudo implementado em `vite-plugins/positivus-dev-component-index.js`, um plugin Vite ativo só em modo dev (`apply: 'serve'`) — não roda no `vite build`, não afeta o site publicado nem o `index.html` real.
- Rotas servidas só em dev:
  - `/__components` → lista os componentes (varre `src/components/<nivel>/positivus-<nome>/` procurando pastas com um `<nome>.html`).
  - `/__components/<nivel>/<nome>` → preview do componente: lê o `.html`/`.css` do disco e monta um Shadow DOM de verdade via `<script>` (`attachShadow` + `<style>` com o CSS do componente) — a regra `:host { ... }` funciona igual funcionaria no componente real.
- O `<head>` das duas páginas acima (fora do Shadow DOM) é lido direto do `<head>` do `index.html` real — viewport, favicon, título (sobrescrito pelo da própria página de dev), links de CSS globais e fonts. Qualquer coisa nova adicionada ao `<head>` do site (uma meta tag, um novo CSS global, etc.) aparece nas páginas de dev sozinha, sem editar o plugin. Um `href`/`src` relativo do jeito que está no `index.html` (ex: `./favicon.svg`) só funciona lá porque o `index.html` mora na raiz do site; como as rotas de preview podem estar níveis abaixo de `/__components`, o plugin reescreve esses caminhos relativos pra absolutos antes de devolver o HTML pra `server.transformIndexHtml` (que resolve o `base`, injeta o client do HMR, etc. — o mesmo pipeline que o Vite usa pro `index.html` de verdade). Já o CSS injetado dentro do Shadow DOM simulado do preview (`reset.css` + `typograph.css` + `global.css`) é fixo, espelhando exatamente o que `src/components/base-component.js` adota de verdade — se um dia o `BaseComponent` passar a adotar mais um arquivo, atualizar os dois lugares juntos. Como o plugin lê `reset.css` cru do disco (sem passar pelo pipeline de CSS do Vite), o `@import 'eric-meyer-reset/...'` daquele arquivo não resolve sozinho dentro do `<style>` da página de preview — o plugin trata esse caso à parte (ver `readResetCss` em `positivus-dev-component-index.js`), injetando o CSS real do pacote e removendo a linha de `@import` do restante do arquivo.
- Tudo é lido do disco a cada requisição — criar um componente novo, adicionar um `.css` em `src/styles/` ou editar `.html`/`.css` de um componente já reflete com um refresh na página, sem precisar reiniciar o `npm run dev`.
- `vite.config.js` define `server.open: '__components'` pra abrir a página de lista automaticamente ao rodar `npm run dev`.
- Se o `.html` do componente usa a tag de outro componente aninhado (composição), o preview injeta um `<script type="module">` carregando o `.js` de cada tag aninhada encontrada — sem isso, a tag apareceria "crua" (sem upgrade do Custom Element), já que este preview monta o Shadow DOM na mão, sem passar pelo `.js` do próprio componente sendo visualizado.
- A página de preview também injeta `<base href="...">` no `<head>` — necessário porque essa rota vive níveis abaixo da raiz do site (`/__components/<nivel>/<nome>`); sem o `<base>`, um caminho relativo de imagem (`./assets/<funcao>/<arquivo>`, ver "Imagens em public/assets" abaixo) resolveria contra a URL do preview em vez da raiz, e quebraria — tanto pro componente sendo visualizado quanto pra um componente aninhado real dentro dele (que carrega seu `.html` original, sem nenhuma reescrita deste plugin).

## Geração automática de arquivos de componente

`npm run generate:component` (roda `scripts/generate-component-files.js`) é um comando manual, não um hook de git — não dispara sozinho em nenhum momento, precisa ser chamado explicitamente. Essa decisão é proposital: um hook de `pre-commit` (via Husky) foi tentado antes, mas depende de cada dev ter o Husky instalado corretamente (o que pode falhar silenciosamente, ex: `npm config get ignore-scripts` como `true` bloqueando o `prepare` do Husky sem aviso nenhum) — um comando manual sempre funciona igual, independente da máquina.

- Varre `src/components/<nivel>/positivus-<nome>/` procurando toda pasta que já tenha um `.html` (mesma lógica de `vite-plugins/positivus-dev-component-index.js`).
- Pra cada componente encontrado, gera `positivus-<nome>.js`, `.stories.js` e `.test.js` a partir dos templates padrão (ver "Convenção para novos componentes" acima) — só os que ainda não existirem; nunca sobrescreve um arquivo já criado manualmente.
- O teste gerado é mínimo (só confirma que a tag foi registrada via `customElements.get`) — não tenta adivinhar o conteúdo real do `.html`, que quem criou o componente pode complementar depois.
- Pra cada componente com algum arquivo gerado, o comando já faz `git add` só desses arquivos novos e cria um commit próprio, seguindo a convenção de commits do projeto: `feat: gera js, storybook e teste de positivus-<nome>` (sem escopo — commits gerados automaticamente por scripts não usam o escopo de nível/pasta, só commits feitos manualmente por uma pessoa). Não inclui o `.html`/`.css` do componente nesse commit — esses continuam sendo commitados por quem os criou, no momento que preferir.
- Não gera e2e (Cypress) — por convenção, e2e testa o `index.html` real, não componentes isolados (ver seção "Testes" abaixo).
- Não edita `src/main.js` nem `index.html` — os passos 6–7 da convenção continuam manuais.

## Imagens em `public/assets`

Imagens ficam em `public/assets/<funcao>/<arquivo>` — organizadas por **função** (o que a imagem é), não por componente/nível: `logos/`, `icons/`, `illustrations/`, `bgs/` (background), etc. — crie uma pasta de função nova só quando surgir uma categoria real, não de antemão. Isso é proposital: como a mesma imagem pode ser usada por mais de um componente (ex: um ícone usado em dois cards diferentes), organizar por componente obrigaria duplicar o arquivo ou escolher um "dono" arbitrário. `public/` é copiado por inteiro pro `dist/` sem passar pelo pipeline de bundling do Vite (sem hash, sem otimização) — arquivos ali são servidos com o caminho exatamente como estão no disco.

- Referencie a imagem no `.html` do componente com caminho relativo, ex: `<img src="./assets/logos/amazon-logo.png">`. Isso funciona sozinho, sem `import`, sem script, tanto em dev quanto depois do `npm run build` — o relativo resolve contra a URL da página (sempre a raiz do site, já que é uma SPA de página única), igual já acontece com `public/favicon.svg` referenciado no `index.html` (ver seção "Deploy" abaixo).
- Estrutura **plana** dentro de cada pasta de função (sem subpasta por componente) — o nome do arquivo precisa ser único dentro da própria pasta de função (ex: não pode ter dois `icon.svg` dentro de `icons/`; nomeie de forma descritiva, `seta-direita.svg`, não `icon.svg`).
- **Não** existe mais um `npm run generate:image-imports`/pasta `positivus-<nome>/images/` — essa era a convenção antiga (imagem colocada ao lado do componente, resolvida via `import` do Vite) e foi substituída por `public/assets/` justamente pra eliminar a necessidade desse `import`/script.
- Mesma regra vale pra imagem passada como prop (ver "Props e composição de componentes" acima): o valor do atributo já é o caminho final relativo a `public/assets/`, funciona igual em qualquer lugar (`index.html`, `.html` de outro componente, valor de atributo) sem processamento nenhum.
- O preview de dev (`/__components/<nivel>/<nome>`) resolve esse caminho relativo sozinho via `<base href="...">` injetado na própria página de preview (ver "Preview automático de componentes" abaixo) — não precisa de nada manual só pra visualizar.
- Não reconhece imagem referenciada via CSS (`background-image: url(...)`) porque não precisa — `url()` dentro do `.css` do componente já é resolvido corretamente pelo Vite (o CSS passa pelo pipeline de assets antes de virar string `?inline`), diferente do `.html`; usar `public/assets/...` direto no `url()` também funciona, sem mistério.

## Geração automática de imports de composição

Custom Elements se auto-atualizam onde aparecerem (inclusive dentro de Shadow DOM) assim que o `.js` que os define é carregado em algum lugar da página — usar a tag de um componente já existente dentro do `.html` de outro (ou na `index.html`) não precisa de nenhuma sintaxe especial. Só falta garantir que aquele `.js` seja carregado.

`npm run generate:composition-imports` (roda `scripts/generate-component-composition-imports.js`) automatiza esse `import`. Comando manual, independente dos outros dois:

- Varre os mesmos componentes que os outros scripts, procurando tags `positivus-*` usadas dentro do `.html` (exceto a própria tag do componente) — pra cada uma encontrada, garante `import '../../<nivel>/<nome>/<nome>.js';` no `.js` do componente que a usa (insere só o que falta).
- Também varre a `index.html`, garantindo o import equivalente em `src/main.js` — automatiza o que seria o passo manual 6 da convenção, sempre que a tag já estiver em uso na `index.html`.
- Se a tag usada não corresponder a nenhum componente encontrado, avisa e pula (não quebra o script). Se o `.js` do componente que usa a tag ainda não existir, avisa pra rodar `npm run generate:component` antes.
- Mesma regra de commit dos outros dois scripts: `feat: adiciona import de composição em positivus-<nome>` (ou `feat: adiciona import de composição na index` pro `main.js`), sem escopo.

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
- Como os componentes são Custom Elements nativos (sem Lit), o `render` de cada story cria o elemento via `document.createElement('positivus-<nome>')` e, se precisar passar props customizados, usa `el.setAttribute('nome', 'valor')` antes de retornar (ver "Props e composição de componentes" acima).
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
- Teste cria a instância do componente via `document.createElement('positivus-<nome>')` e verifica o conteúdo do `shadowRoot` — nunca testar detalhes internos do `BaseComponent` a partir do teste *de um componente* (isso já é coberto pelos testes dos componentes que o usam). O próprio `BaseComponent` tem um teste dedicado (`src/components/base-component.test.js`), único lugar que testa esses detalhes diretamente (binding de `data-prop`, `attributeChangedCallback`, `extractPropNames`).
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
