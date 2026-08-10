import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  findComponents,
  isLocalImageSrc,
  toClassName,
  jsTemplate,
} from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

/**
 * Acha os `<img src="...">` locais (não http(s)/data:/absoluto) de um HTML,
 * na ordem em que aparecem, sem duplicados.
 */
function extractImageSources(htmlContent) {
  const matches = htmlContent.matchAll(
    /<img\b[^>]*\ssrc\s*=\s*["']([^"']+)["'][^>]*>/gi,
  );
  const seen = new Set();
  const sources = [];

  for (const match of matches) {
    const src = match[1];
    if (!isLocalImageSrc(src)) continue;
    if (seen.has(src)) continue;

    seen.add(src);
    sources.push(src);
  }

  return sources;
}

function buildVarName(src, usedNames) {
  const base = path.basename(src, path.extname(src));
  const pascal = base
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  let varName = `img${pascal}`;
  let suffix = 2;
  while (usedNames.has(varName)) {
    varName = `img${pascal}${suffix}`;
    suffix += 1;
  }

  usedNames.add(varName);
  return varName;
}

function buildImages(sources) {
  const usedNames = new Set();
  return sources.map((src) => ({ src, varName: buildVarName(src, usedNames) }));
}

function insertImports(jsContent, importLines) {
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

function insertWiring(jsContent, wiringLines, name) {
  if (wiringLines.length === 0) return jsContent;

  const superRegex = /^\s*super\(\{[^}]*\}\);$/m;
  const match = superRegex.exec(jsContent);
  if (!match) {
    console.warn(
      `generate-component-image-imports: não achei "super({ template, styles });" em ${name}.js — pulei o wiring de imagens, adicione manualmente`,
    );
    return jsContent;
  }

  const insertPoint = match.index + match[0].length;
  const insertion = '\n' + wiringLines.join('\n');
  return (
    jsContent.slice(0, insertPoint) + insertion + jsContent.slice(insertPoint)
  );
}

/**
 * @returns {string | null} caminho do .js criado/atualizado, ou null se nada mudou
 */
function processComponent({ level, name }) {
  const componentDir = path.join(PROJECT_ROOT, 'src/components', level, name);
  const htmlPath = path.join(componentDir, `${name}.html`);
  const jsPath = path.join(componentDir, `${name}.js`);

  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  const sources = extractImageSources(htmlContent);
  if (sources.length === 0) return null;

  const images = buildImages(sources);

  if (!fs.existsSync(jsPath)) {
    const className = toClassName(name);
    fs.writeFileSync(jsPath, jsTemplate(name, className, images));
    console.log(
      `generate-component-image-imports: criado ${path.relative(PROJECT_ROOT, jsPath)} com ${images.length} imagem(ns)`,
    );
    return jsPath;
  }

  const originalContent = fs.readFileSync(jsPath, 'utf-8');
  const missing = images.filter(
    ({ src }) => !originalContent.includes(`from '${src}'`),
  );
  if (missing.length === 0) return null;

  const importLines = missing.map(
    ({ varName, src }) => `import ${varName} from '${src}';`,
  );
  const wiringLines = missing.map(
    ({ varName, src }) =>
      `    this.$$('img[src="${src}"]').forEach((img) => {\n      img.src = ${varName};\n    });`,
  );

  let updatedContent = insertImports(originalContent, importLines);
  updatedContent = insertWiring(updatedContent, wiringLines, name);

  if (updatedContent === originalContent) return null;

  fs.writeFileSync(jsPath, updatedContent);
  console.log(
    `generate-component-image-imports: atualizado ${path.relative(PROJECT_ROOT, jsPath)} com ${missing.length} imagem(ns) nova(s)`,
  );
  return jsPath;
}

function commitTouchedFile(filePath, { name }) {
  if (!filePath) return;

  execFileSync('git', ['add', filePath], { cwd: PROJECT_ROOT });
  const message = `feat: adiciona import de imagens em ${name}`;
  execFileSync('git', ['commit', '-m', message], { cwd: PROJECT_ROOT });
  console.log(`generate-component-image-imports: commit criado — "${message}"`);
}

function main() {
  const components = findComponents(PROJECT_ROOT);

  for (const component of components) {
    const touchedFile = processComponent(component);
    commitTouchedFile(touchedFile, component);
  }
}

try {
  main();
} catch (error) {
  console.error(
    'generate-component-image-imports: falhou ao gerar imports de imagens',
  );
  console.error(error);
  process.exit(1);
}
