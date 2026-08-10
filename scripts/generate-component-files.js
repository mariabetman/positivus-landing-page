import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS_ROOT = 'src/components';
const LEVELS = ['atoms', 'molecules', 'organisms'];

/**
 * Varre src/components/<nivel>/positivus-<nome>/ procurando componentes que
 * já tenham o .html (mesmo padrão do vite-plugins/positivus-dev-component-index.js).
 */
function findComponents() {
  const components = [];

  for (const level of LEVELS) {
    const levelDir = path.join(PROJECT_ROOT, COMPONENTS_ROOT, level);
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

function toPascalCase(name) {
  return name
    .replace(/^positivus-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function toLevelTitle(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function jsTemplate(name, className) {
  return `import { BaseComponent } from '../../base-component.js';
import template from './${name}.html?raw';
import styles from './${name}.css?inline';

export class ${className} extends BaseComponent {
  constructor() {
    super({ template, styles });
  }
}

customElements.define('${name}', ${className});
`;
}

function storiesTemplate(name, className, levelTitle) {
  return `import './${name}.js';

export default {
  title: '${levelTitle}/${className}',
  tags: ['autodocs'],
};

export const Default = {
  render: () => document.createElement('${name}'),
};
`;
}

function testTemplate(name) {
  return `import { describe, expect, it } from 'vitest';
import './${name}.js';

describe('${name}', () => {
  it('registers the custom element', () => {
    expect(customElements.get('${name}')).toBeDefined();
  });
});
`;
}

function generateMissingFiles({ level, name }) {
  const componentDir = path.join(PROJECT_ROOT, 'src/components', level, name);
  const className = `Positivus${toPascalCase(name)}`;
  const levelTitle = toLevelTitle(level);

  const files = [
    { file: `${name}.js`, content: jsTemplate(name, className) },
    { file: `${name}.stories.js`, content: storiesTemplate(name, className, levelTitle) },
    { file: `${name}.test.js`, content: testTemplate(name) },
  ];

  const createdFiles = [];

  for (const { file, content } of files) {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) continue;

    fs.writeFileSync(filePath, content);
    createdFiles.push(filePath);
    console.log(`generate-component-files: criado ${path.relative(PROJECT_ROOT, filePath)}`);
  }

  return createdFiles;
}

function commitCreatedFiles(createdFiles, { name }) {
  if (createdFiles.length === 0) return;

  execFileSync('git', ['add', ...createdFiles], { cwd: PROJECT_ROOT });
  const message = `feat: gera js, storybook e teste de ${name}`;
  execFileSync('git', ['commit', '-m', message], { cwd: PROJECT_ROOT });
  console.log(`generate-component-files: commit criado — "${message}"`);
}

function main() {
  const components = findComponents();

  for (const component of components) {
    const createdFiles = generateMissingFiles(component);
    commitCreatedFiles(createdFiles, component);
  }
}

try {
  main();
} catch (error) {
  console.error('generate-component-files: falhou ao gerar arquivos do componente');
  console.error(error);
  process.exit(1);
}
