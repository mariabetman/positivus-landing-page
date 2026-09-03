import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  findComponents,
  toClassName,
  toPascalCase,
  toLevelTitle,
  jsTemplate,
  readVariantAxes,
} from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * Valores não-padrão (tudo menos o primeiro, `'default'`) de cada eixo,
 * junto com o nome do eixo — uma story por valor deixa evidente quais
 * variantes existem, sem precisar abrir a pasta `variants/`. Combinar mais
 * de um eixo ao mesmo tempo continua possível ao vivo no painel Controls
 * do Storybook, só não gera uma story pronta por combinação (eixos de
 * estilo compõem em runtime, não precisam de arquivo/story por
 * cruzamento).
 */
function nonDefaultValues(axes) {
  return axes.flatMap((axis) =>
    axis.values.slice(1).map((value) => ({ axis: axis.name, value })),
  );
}

function variantStoryBlock({ axis, value }) {
  return `
export const ${toPascalCase(value)} = {
  args: { ${axis}: '${value}' },
};
`;
}

/**
 * @param {{name: string, values: string[]}[]} variantAxes eixos achados em
 * `variants/` (ver `readVariantAxes`) — uma story por valor não-padrão de
 * cada eixo.
 */
function storiesTemplate(name, className, levelTitle, variantAxes) {
  const variantStories = nonDefaultValues(variantAxes)
    .map(variantStoryBlock)
    .join('');

  return `import './${name}.js';
import template from './${name}.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export default {
  title: '${levelTitle}/${className}',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template, variantFiles),
  render: renderWithArgs('${name}'),
};

export const Default = {
  args: {},
};
${variantStories}`;
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

export function generateMissingFiles(projectRoot, { level, name }) {
  const componentDir = path.join(projectRoot, 'src/components', level, name);
  const className = toClassName(name);
  const levelTitle = toLevelTitle(level);
  const variantAxes = readVariantAxes(componentDir);

  const files = [
    { file: `${name}.js`, content: jsTemplate(name, className) },
    {
      file: `${name}.stories.js`,
      content: storiesTemplate(name, className, levelTitle, variantAxes),
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

/**
 * Componente que já tem `.stories.js` (então `generateMissingFiles` não
 * mexeu nele) mas ganhou uma variante nova no `.html` — acrescenta só a(s)
 * story(ies) que ainda não existirem, sem tocar no resto do arquivo (nunca
 * sobrescreve uma story que já foi customizada à mão).
 *
 * @returns {string | null} caminho do .stories.js atualizado, ou null se nada mudou
 */
export function addMissingVariantStories(projectRoot, { level, name }) {
  const componentDir = path.join(projectRoot, 'src/components', level, name);
  const storiesPath = path.join(componentDir, `${name}.stories.js`);
  if (!fs.existsSync(storiesPath)) return null;

  const values = nonDefaultValues(readVariantAxes(componentDir));
  if (values.length === 0) return null;

  const originalContent = fs.readFileSync(storiesPath, 'utf-8');
  const missingValues = values.filter(
    ({ value }) => !originalContent.includes(`export const ${toPascalCase(value)}`),
  );
  if (missingValues.length === 0) return null;

  const updatedContent =
    originalContent.trimEnd() + '\n' + missingValues.map(variantStoryBlock).join('');
  fs.writeFileSync(storiesPath, updatedContent);
  console.log(
    `generate-component-files: atualizado ${path.relative(PROJECT_ROOT, storiesPath)} com ${missingValues.length} story(ies) de variante`,
  );
  return storiesPath;
}

function commitTouchedFiles(files, message) {
  if (files.length === 0) return;

  execFileSync('git', ['add', ...files], { cwd: PROJECT_ROOT });
  execFileSync('git', ['commit', '-m', message], { cwd: PROJECT_ROOT });
  console.log(`generate-component-files: commit criado — "${message}"`);
}

function main() {
  const components = findComponents(PROJECT_ROOT);
  let hasError = false;

  for (const component of components) {
    const label = `${component.level}/${component.name}`;

    try {
      const createdFiles = generateMissingFiles(PROJECT_ROOT, component);
      commitTouchedFiles(
        createdFiles,
        `feat: gera js, storybook e teste de ${component.name}`,
      );

      const updatedStoriesFile = addMissingVariantStories(PROJECT_ROOT, component);
      commitTouchedFiles(
        updatedStoriesFile ? [updatedStoriesFile] : [],
        `feat: adiciona story de variante em ${component.name}`,
      );

      console.log(`generate-component-files: ${label} ok`);
    } catch (error) {
      hasError = true;
      console.error(`generate-component-files: falhou em ${label}`);
      console.error(error);
    }
  }

  return hasError;
}

// Só roda o CLI (varredura + escrita + commit de todo componente) quando o
// arquivo é executado direto (`npm run generate:component`) — evita que só
// importar `generateMissingFiles`/`addMissingVariantStories` de outro lugar
// (ver `vite-plugins/positivus-dev-component-index.js`) dispare esse
// processo inteiro como efeito colateral do import.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
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
}
