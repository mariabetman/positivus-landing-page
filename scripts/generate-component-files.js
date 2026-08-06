import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENT_HTML_PATTERN =
  /^src\/components\/(atoms|molecules|organisms)\/(positivus-[a-z0-9-]+)\/\2\.html$/;

function getStagedAddedFiles() {
  const output = execFileSync(
    'git',
    ['diff', '--cached', '--name-only', '--diff-filter=A'],
    { cwd: PROJECT_ROOT, encoding: 'utf-8' },
  );

  return output.split('\n').filter(Boolean);
}

function findNewComponents(stagedFiles) {
  const components = [];

  for (const file of stagedFiles) {
    const match = file.match(COMPONENT_HTML_PATTERN);
    if (match) {
      components.push({ level: match[1], name: match[2] });
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

  for (const { file, content } of files) {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) continue;

    fs.writeFileSync(filePath, content);
    execFileSync('git', ['add', filePath], { cwd: PROJECT_ROOT });
    console.log(`generate-component-files: criado ${path.relative(PROJECT_ROOT, filePath)}`);
  }
}

function main() {
  const stagedFiles = getStagedAddedFiles();
  const newComponents = findNewComponents(stagedFiles);

  for (const component of newComponents) {
    generateMissingFiles(component);
  }
}

try {
  main();
} catch (error) {
  console.error('generate-component-files: falhou ao gerar arquivos do componente');
  console.error(error);
  process.exit(1);
}
