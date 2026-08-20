import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  findComponents,
  findComponentByTagName,
  extractNestedComponentTags,
  insertImportLines,
} from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const INDEX_HTML_PATH = path.join(PROJECT_ROOT, 'index.html');
const MAIN_JS_PATH = path.join(PROJECT_ROOT, 'src/main.js');

/**
 * Custom Elements se auto-atualizam onde aparecerem (inclusive dentro de
 * Shadow DOM) assim que o `.js` que os define é carregado em algum lugar da
 * página — não precisa de nenhuma sintaxe especial pra "usar um componente
 * dentro de outro". Só falta garantir que esse `.js` seja carregado; esse
 * script automatiza isso, tanto pra composição entre componentes quanto pra
 * uso direto na index.html (que hoje seria o passo manual 6 da convenção).
 */

/**
 * @returns {string | null} caminho do .js atualizado, ou null se nada mudou
 */
function processComponent(component, allComponents) {
  const { level, name } = component;
  const componentDir = path.join(PROJECT_ROOT, 'src/components', level, name);
  const htmlPath = path.join(componentDir, `${name}.html`);
  const jsPath = path.join(componentDir, `${name}.js`);

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const nestedTags = extractNestedComponentTags(htmlContent, name);
  if (nestedTags.length === 0) return null;

  if (!fs.existsSync(jsPath)) {
    console.warn(
      `generate-component-composition-imports: ${name}.js ainda não existe — rode "npm run generate:component" antes`,
    );
    return null;
  }

  const originalContent = fs.readFileSync(jsPath, 'utf-8');
  const importLines = [];

  for (const tag of nestedTags) {
    const nested = findComponentByTagName(allComponents, tag);
    if (!nested) {
      console.warn(
        `generate-component-composition-imports: ${name} usa <${tag}>, mas não achei esse componente`,
      );
      continue;
    }

    const importLine = `import '../../${nested.level}/${nested.name}/${nested.name}.js';`;
    if (!originalContent.includes(importLine) && !importLines.includes(importLine)) {
      importLines.push(importLine);
    }
  }

  if (importLines.length === 0) return null;

  const updatedContent = insertImportLines(originalContent, importLines);
  fs.writeFileSync(jsPath, updatedContent);
  console.log(
    `generate-component-composition-imports: atualizado ${path.relative(PROJECT_ROOT, jsPath)} com ${importLines.length} import(s) de composição`,
  );
  return jsPath;
}

/**
 * @returns {string | null} caminho do main.js, ou null se nada mudou
 */
function processIndexHtml(allComponents) {
  if (!fs.existsSync(INDEX_HTML_PATH)) return null;

  const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');
  const tags = extractNestedComponentTags(indexHtml, '');
  if (tags.length === 0) return null;

  const originalContent = fs.readFileSync(MAIN_JS_PATH, 'utf-8');
  const importLines = [];

  for (const tag of tags) {
    const component = findComponentByTagName(allComponents, tag);
    if (!component) {
      console.warn(
        `generate-component-composition-imports: index.html usa <${tag}>, mas não achei esse componente`,
      );
      continue;
    }

    const importLine = `import './components/${component.level}/${component.name}/${component.name}.js';`;
    if (!originalContent.includes(importLine) && !importLines.includes(importLine)) {
      importLines.push(importLine);
    }
  }

  if (importLines.length === 0) return null;

  const updatedContent = insertImportLines(originalContent, importLines);
  fs.writeFileSync(MAIN_JS_PATH, updatedContent);
  console.log(
    `generate-component-composition-imports: atualizado src/main.js com ${importLines.length} import(s) usados na index.html`,
  );
  return MAIN_JS_PATH;
}

function commitTouchedFile(filePath, label) {
  if (!filePath) return;

  execFileSync('git', ['add', filePath], { cwd: PROJECT_ROOT });
  const message = label
    ? `feat: adiciona import de composição em ${label}`
    : 'feat: adiciona import de composição na index';
  execFileSync('git', ['commit', '-m', message], { cwd: PROJECT_ROOT });
  console.log(
    `generate-component-composition-imports: commit criado — "${message}"`,
  );
}

function main() {
  const components = findComponents(PROJECT_ROOT);
  let hasError = false;

  for (const component of components) {
    const label = `${component.level}/${component.name}`;

    try {
      const touchedFile = processComponent(component, components);
      commitTouchedFile(touchedFile, component.name);
      console.log(`generate-component-composition-imports: ${label} ok`);
    } catch (error) {
      hasError = true;
      console.error(`generate-component-composition-imports: falhou em ${label}`);
      console.error(error);
    }
  }

  try {
    const touchedMainJs = processIndexHtml(components);
    commitTouchedFile(touchedMainJs, null);
    console.log('generate-component-composition-imports: index.html ok');
  } catch (error) {
    hasError = true;
    console.error(
      'generate-component-composition-imports: falhou ao processar a index.html',
    );
    console.error(error);
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
    'generate-component-composition-imports: falhou ao gerar imports de composição',
  );
  console.error(error);
  process.exit(1);
}
