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
  extractVariantAxes,
} from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * Produto cartesiano dos valores de cada eixo — cada combinação vira
 * `[{ axis, value }, ...]`, na mesma ordem dos eixos recebidos.
 */
function cartesianProduct(axes) {
  return axes.reduce(
    (combos, axis) =>
      combos.flatMap((combo) =>
        axis.values.map((value) => [...combo, { axis: axis.name, value }]),
      ),
    [[]],
  );
}

/**
 * Combinações que têm pelo menos um eixo fora do valor padrão (o primeiro
 * valor daquele eixo) — a combinação "tudo padrão" já é a story `Default`.
 * Cada combinação devolvida só carrega os eixos não-padrão daquela
 * combinação (os outros ficam de fora dos `args`, deixando o próprio
 * componente cair no padrão de cada eixo, igual já acontece hoje pra um
 * eixo só).
 */
function nonDefaultCombos(axes) {
  return cartesianProduct(axes)
    .map((combo) =>
      combo.filter((entry, index) => entry.value !== axes[index].values[0]),
    )
    .filter((combo) => combo.length > 0);
}

function variantStoryBlock(combo) {
  const name = combo.map((entry) => toPascalCase(entry.value)).join('');
  const args = combo
    .map((entry) => `${entry.axis}: '${entry.value}'`)
    .join(', ');

  return `
export const ${name} = {
  args: { ${args} },
};
`;
}

/**
 * @param {{name: string, values: string[]}[]} variantAxes eixos de
 * `data-variant`/`data-variant-<eixo>` achados no .html — uma story por
 * combinação não-toda-padrão deixa evidente quais variantes existem, sem
 * precisar abrir o `.html`.
 */
function storiesTemplate(name, className, levelTitle, variantAxes) {
  const variantStories = nonDefaultCombos(variantAxes)
    .map(variantStoryBlock)
    .join('');

  return `import './${name}.js';
import template from './${name}.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: '${levelTitle}/${className}',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
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

function generateMissingFiles({ level, name }) {
  const componentDir = path.join(PROJECT_ROOT, 'src/components', level, name);
  const className = toClassName(name);
  const levelTitle = toLevelTitle(level);
  const htmlContent = fs.readFileSync(
    path.join(componentDir, `${name}.html`),
    'utf-8',
  );
  const variantAxes = extractVariantAxes(htmlContent);

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
function addMissingVariantStories({ level, name }) {
  const componentDir = path.join(PROJECT_ROOT, 'src/components', level, name);
  const storiesPath = path.join(componentDir, `${name}.stories.js`);
  if (!fs.existsSync(storiesPath)) return null;

  const htmlContent = fs.readFileSync(
    path.join(componentDir, `${name}.html`),
    'utf-8',
  );
  const combos = nonDefaultCombos(extractVariantAxes(htmlContent));
  if (combos.length === 0) return null;

  const originalContent = fs.readFileSync(storiesPath, 'utf-8');
  const missingCombos = combos.filter(
    (combo) =>
      !originalContent.includes(
        `export const ${combo.map((entry) => toPascalCase(entry.value)).join('')}`,
      ),
  );
  if (missingCombos.length === 0) return null;

  const updatedContent =
    originalContent.trimEnd() + '\n' + missingCombos.map(variantStoryBlock).join('');
  fs.writeFileSync(storiesPath, updatedContent);
  console.log(
    `generate-component-files: atualizado ${path.relative(PROJECT_ROOT, storiesPath)} com ${missingCombos.length} story(ies) de variante`,
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
      const createdFiles = generateMissingFiles(component);
      commitTouchedFiles(
        createdFiles,
        `feat: gera js, storybook e teste de ${component.name}`,
      );

      const updatedStoriesFile = addMissingVariantStories(component);
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
