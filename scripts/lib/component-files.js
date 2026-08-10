import fs from 'node:fs';
import path from 'node:path';

export const COMPONENTS_ROOT = 'src/components';
export const LEVELS = ['atoms', 'molecules', 'organisms'];

/**
 * Varre src/components/<nivel>/positivus-<nome>/ procurando componentes que
 * já tenham o .html (mesmo padrão do vite-plugins/positivus-dev-component-index.js).
 */
export function findComponents(projectRoot) {
  const components = [];

  for (const level of LEVELS) {
    const levelDir = path.join(projectRoot, COMPONENTS_ROOT, level);
    if (!fs.existsSync(levelDir)) continue;

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

/**
 * @param {string} name
 * @param {string} className
 * @param {{ varName: string, src: string }[]} images
 */
export function jsTemplate(name, className, images = []) {
  const importLines = images.map(
    ({ varName, src }) => `import ${varName} from '${src}';`,
  );
  const wiringLines = images.map(
    ({ varName, src }) =>
      `    this.$$('img[src="${src}"]').forEach((img) => {\n      img.src = ${varName};\n    });`,
  );

  return `import { BaseComponent } from '../../base-component.js';
import template from './${name}.html?raw';
import styles from './${name}.css?inline';
${importLines.length ? importLines.join('\n') + '\n' : ''}
export class ${className} extends BaseComponent {
  constructor() {
    super({ template, styles });
${wiringLines.length ? wiringLines.join('\n') + '\n' : ''}  }
}

customElements.define('${name}', ${className});
`;
}
