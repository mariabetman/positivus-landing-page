import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  findComponents,
  toClassName,
  toLevelTitle,
  jsTemplate,
} from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

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
  const className = toClassName(name);
  const levelTitle = toLevelTitle(level);

  const files = [
    { file: `${name}.js`, content: jsTemplate(name, className) },
    {
      file: `${name}.stories.js`,
      content: storiesTemplate(name, className, levelTitle),
    },
    { file: `${name}.test.js`, content: testTemplate(name) },
  ];

  const createdFiles = [];

  for (const { file, content } of files) {
    const filePath = path.join(componentDir, file);
    if (fs.existsSync(filePath)) continue;

    fs.writeFileSync(filePath, content);
    createdFiles.push(filePath);
    console.log(
      `generate-component-files: criado ${path.relative(PROJECT_ROOT, filePath)}`,
    );
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
  const components = findComponents(PROJECT_ROOT);
  let hasError = false;

  for (const component of components) {
    const label = `${component.level}/${component.name}`;

    try {
      const createdFiles = generateMissingFiles(component);
      commitCreatedFiles(createdFiles, component);
      console.log(`generate-component-files: ${label} ok`);
    } catch (error) {
      hasError = true;
      console.error(`generate-component-files: falhou em ${label}`);
      console.error(error);
    }
  }

  return hasError;
}

try {
  const hasError = main();
  if (hasError) {
    process.exit(1);
  }
} catch (error) {
  console.error(
    'generate-component-files: falhou ao gerar arquivos do componente',
  );
  console.error(error);
  process.exit(1);
}
