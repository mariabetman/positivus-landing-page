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
    );
}

/**
 * Varre src/components/<nivel>/positivus-<nome>/ procurando componentes que
 * já tenham o .html (mesmo padrão do vite-plugins/positivus-dev-component-index.js).
 */
export function findComponents(projectRoot) {
  const components = [];

  for (const level of listLevels(projectRoot)) {
    const levelDir = path.join(projectRoot, COMPONENTS_ROOT, level);

    for (const name of fs.readdirSync(levelDir)) {
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

export class ${className} extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('${name}', ${className});
`;
}
