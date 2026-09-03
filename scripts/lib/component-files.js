import fs from 'node:fs';
import path from 'node:path';

export const COMPONENTS_ROOT = 'src/components';

/**
 * Níveis do Atomic Design existentes no projeto (ex: atoms, molecules,
 * organisms, e futuramente templates, pages, etc.) — descobertos lendo as
 * subpastas de src/components/ em vez de uma lista fixa, pra reconhecer
 * automaticamente um nível novo assim que a pasta for criada.
 */
export function listLevels(projectRoot) {
  const componentsDir = path.join(projectRoot, COMPONENTS_ROOT);
  if (!fs.existsSync(componentsDir)) return [];

  return fs
    .readdirSync(componentsDir)
    .filter((entry) =>
      fs.statSync(path.join(componentsDir, entry)).isDirectory(),
    )
    .sort();
}

/**
 * Varre src/components/<nivel>/positivus-<nome>/ procurando componentes que
 * já tenham o .html (mesmo padrão do vite-plugins/positivus-dev-component-index.js).
 * Ordenado por nome — além de determinístico, isso faz uma família de
 * variantes (positivus-x, positivus-x-compact...) aparecer sempre agrupada
 * e em ordem no preview de dev (`npm run generate:composition-imports` e os
 * outros scripts também dependem dessa mesma ordem pra rodar sempre igual).
 */
export function findComponents(projectRoot) {
  const components = [];

  for (const level of listLevels(projectRoot)) {
    const levelDir = path.join(projectRoot, COMPONENTS_ROOT, level);

    for (const name of fs.readdirSync(levelDir).sort()) {
      const componentDir = path.join(levelDir, name);
      if (!fs.statSync(componentDir).isDirectory()) continue;

      const htmlFile = path.join(componentDir, `${name}.html`);
      if (fs.existsSync(htmlFile)) {
        components.push({ level, name });
      }
    }
  }

  return components;
}

export function toPascalCase(name) {
  return name
    .replace(/^positivus-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function toLevelTitle(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function toClassName(name) {
  return `Positivus${toPascalCase(name)}`;
}

const EXTERNAL_URL_PATTERN = /^([a-z]+:)?\/\//i;

/**
 * Um `href`/`src` conta como referência local (candidata a reescrita de
 * caminho) quando não é http(s)/protocol-relative, `data:` nem um caminho
 * absoluto — usado hoje só pro `<head>` real (favicon, etc.) no preview de
 * dev, ver `readIndexHeadHtml` em `positivus-dev-component-index.js`.
 */
export function isLocalImageSrc(src) {
  return !(
    EXTERNAL_URL_PATTERN.test(src) ||
    src.startsWith('data:') ||
    src.startsWith('/')
  );
}

const NESTED_COMPONENT_TAG_PATTERN = /<(positivus-[a-z0-9-]+)\b/gi;

/**
 * Acha tags `positivus-*` usadas dentro de um HTML (exceto a própria tag do
 * componente, `ownName`) — usado pra detectar composição (componente usado
 * dentro de outro) tanto no script de imports quanto no preview de dev.
 */
export function extractNestedComponentTags(htmlContent, ownName) {
  const tags = new Set();

  for (const match of htmlContent.matchAll(NESTED_COMPONENT_TAG_PATTERN)) {
    const tag = match[1].toLowerCase();
    if (tag !== ownName) tags.add(tag);
  }

  return [...tags];
}

export function findComponentByTagName(components, tagName) {
  return components.find((component) => component.name === tagName);
}

/**
 * Lê os eixos de variante de um componente a partir da pasta `variants/`
 * dentro da pasta dele (cada subpasta é um eixo, cada `.html` dentro dela é
 * um valor não-padrão) — usado pra gerar stories em
 * `generate-component-files.js` e pro preview de dev mostrar todas as
 * combinações. Mesma ideia de `BaseComponent.parseVariantFiles` (duplicada
 * aqui de propósito: aquela roda no navegador a partir de
 * `import.meta.glob`, essa aqui é leitura direta de disco em Node, sem nada
 * em comum pra compartilhar de verdade). `values` sempre começa com
 * `'default'` (não tem arquivo pra ele — é o próprio `.html` principal, ou
 * "nenhuma classe extra", dependendo do eixo).
 */
export function readVariantAxes(componentDir) {
  const variantsDir = path.join(componentDir, 'variants');
  if (!fs.existsSync(variantsDir)) return [];

  return fs
    .readdirSync(variantsDir)
    .filter((entry) => fs.statSync(path.join(variantsDir, entry)).isDirectory())
    .sort((a, b) => {
      if (a === 'variant') return -1;
      if (b === 'variant') return 1;
      return a.localeCompare(b);
    })
    .map((axisName) => {
      const axisDir = path.join(variantsDir, axisName);
      const values = fs
        .readdirSync(axisDir)
        .filter((file) => file.endsWith('.html'))
        .map((file) => file.replace(/\.html$/, ''))
        .sort();

      return { name: axisName, values: ['default', ...values] };
    });
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Acha, no `.html` de um componente, o elemento marcado com
 * `data-prop-modifier="<propName>"` e devolve a classe-base dele (a
 * primeira classe já escrita nele) — mesma regra que `BaseComponent#bindProps`
 * usa em runtime (`element.classList[0]`), só que lendo o texto do `.html`
 * direto (Node), sem precisar montar nenhum DOM de verdade. Usado tanto por
 * `readModifierAxes` (preview de dev) quanto por `generate-style-modifier.js`
 * (pra saber onde escrever a regra CSS nova). Devolve `null` se não achar o
 * elemento ou se ele não tiver nenhuma classe.
 */
export function findModifierBaseClass(html, propName) {
  const tagPattern = new RegExp(
    `<[a-zA-Z][^>]*\\sdata-prop-modifier=["']${escapeRegExp(propName)}["'][^>]*>`,
  );
  const tagMatch = html.match(tagPattern);
  if (!tagMatch) return null;

  const classMatch = tagMatch[0].match(/\sclass=["']([^"']+)["']/);
  if (!classMatch) return null;

  return classMatch[1].split(/\s+/)[0];
}

/**
 * Lê os eixos de `data-prop-modifier` de um componente que **já têm CSS
 * escrito** — pra cada `data-prop-modifier="<prop>"` achado no `.html`, acha
 * a classe-base (`findModifierBaseClass`) e procura no `.css` regras
 * exatamente `.<classe-base>--<valor>` (ignora seletor composto, tipo
 * `.card--compact .card__title`, que não é o modificador em si). Espelha
 * `readVariantAxes` (mesmo formato de retorno, mesma leitura direta de
 * disco) — não duplica nada do `BaseComponent`, que não faz esse tipo de
 * leitura de CSS (só aplica a classe, nunca precisa descobrir valor).
 * `data-prop-modifier` sem nenhuma regra de CSS ainda fica de fora do
 * resultado (ver `npm run generate:style-modifier`, em `CLAUDE.md`, pra
 * criar a primeira regra de um valor novo).
 *
 * Exclui qualquer valor que já seja um valor do eixo estrutural `variant`
 * (`readVariantAxes`) do mesmo componente — um bloco de
 * `variants/variant/<valor>.html` pode ter uma classe raiz `card--<valor>`
 * só por convenção BEM (ex: `card--compact`), sem ter nenhuma relação com
 * `data-prop-modifier`; sem essa exclusão, esse valor apareceria duas vezes
 * no preview (uma como `variant=compact`, outra como
 * `appearance=compact`), o que seria enganoso.
 */
export function readModifierAxes(componentDir, name) {
  const htmlFile = path.join(componentDir, `${name}.html`);
  const cssFile = path.join(componentDir, `${name}.css`);
  if (!fs.existsSync(htmlFile) || !fs.existsSync(cssFile)) return [];

  const html = fs.readFileSync(htmlFile, 'utf-8');
  const css = fs.readFileSync(cssFile, 'utf-8');

  const structuralVariantValues = new Set(
    readVariantAxes(componentDir).find((axis) => axis.name === 'variant')
      ?.values ?? [],
  );

  const propNames = new Set(
    [...html.matchAll(/data-prop-modifier=["']([^"']+)["']/g)].map(
      (match) => match[1],
    ),
  );

  const axes = [];
  for (const propName of propNames) {
    const baseClass = findModifierBaseClass(html, propName);
    if (!baseClass) continue;

    const rulePattern = new RegExp(
      `\\.${escapeRegExp(baseClass)}--([a-zA-Z0-9_-]+)(?=\\s*[,{])`,
      'g',
    );
    const values = [
      ...new Set(
        [...css.matchAll(rulePattern)]
          .map((match) => match[1])
          .filter((value) => !structuralVariantValues.has(value)),
      ),
    ].sort();
    if (values.length === 0) continue;

    axes.push({ name: propName, values: ['default', ...values] });
  }

  return axes.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Produto cartesiano dos valores de cada eixo — cada combinação vira
 * `[{ axis, value }, ...]`, na mesma ordem dos eixos recebidos. Usado pelo
 * preview de dev pra enumerar todas as combinações de variante a mostrar.
 */
export function cartesianProduct(axes) {
  return axes.reduce(
    (combos, axis) =>
      combos.flatMap((combo) =>
        axis.values.map((value) => [...combo, { axis: axis.name, value }]),
      ),
    [[]],
  );
}

/**
 * Insere linhas de `import` novas logo depois do último `import` já
 * existente no conteúdo de um `.js` — usado tanto pra imports de imagem
 * quanto pra imports de composição (side-effect import de um componente
 * aninhado), sempre da mesma forma.
 */
export function insertImportLines(jsContent, importLines) {
  if (importLines.length === 0) return jsContent;

  const importRegex = /^import .*;$/gm;
  let lastImportEnd = 0;
  let match;
  while ((match = importRegex.exec(jsContent)) !== null) {
    lastImportEnd = match.index + match[0].length;
  }

  const insertion = '\n' + importLines.join('\n');
  return (
    jsContent.slice(0, lastImportEnd) +
    insertion +
    jsContent.slice(lastImportEnd)
  );
}

/**
 * @param {string} name
 * @param {string} className
 */
export function jsTemplate(name, className) {
  return `import { BaseComponent } from '../../base-component.js';
import template from './${name}.html?raw';
import styles from './${name}.css?inline';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export class ${className} extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template, variantFiles);

  constructor() {
    super({ template, styles, variantFiles });
  }
}

customElements.define('${name}', ${className});
`;
}
