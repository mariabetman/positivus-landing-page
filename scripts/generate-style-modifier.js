import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { findComponents, findModifierBaseClass } from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Cria a regra CSS (vazia, pronta pra preencher) de um novo valor de
 * `data-prop-modifier` — o "gancho" que faz esse valor passar a aparecer no
 * preview automático de dev (ver `readModifierAxes`/`buildVariantsPreview`
 * em `vite-plugins/positivus-dev-component-index.js`), sem precisar de
 * nenhum arquivo à parte (JSON ou outro) descrevendo o valor: o `.css` já é
 * a única fonte de verdade.
 *
 * @returns {string | null} caminho do .css atualizado, ou null se a regra já existia
 */
function generateStyleModifier(name, prop, value) {
  const component = findComponents(PROJECT_ROOT).find((c) => c.name === name);
  if (!component) {
    throw new Error(`componente "${name}" não encontrado`);
  }

  const componentDir = path.join(
    PROJECT_ROOT,
    'src/components',
    component.level,
    component.name,
  );
  const htmlPath = path.join(componentDir, `${name}.html`);
  const cssPath = path.join(componentDir, `${name}.css`);

  const html = fs.readFileSync(htmlPath, 'utf-8');
  const baseClass = findModifierBaseClass(html, prop);
  if (!baseClass) {
    throw new Error(
      `nenhum elemento com data-prop-modifier="${prop}" (e uma classe) encontrado em ${name}.html`,
    );
  }

  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '';
  const existingRulePattern = new RegExp(
    `\\.${escapeRegExp(baseClass)}--${escapeRegExp(value)}(?=\\s*[,{])`,
  );
  if (existingRulePattern.test(css)) {
    console.log(
      `generate-style-modifier: .${baseClass}--${value} já existe em ${name}.css, nada a fazer`,
    );
    return null;
  }

  const newRule = `\n.${baseClass}--${value} {\n}\n`;
  fs.writeFileSync(cssPath, css.replace(/\s*$/, '') + '\n' + newRule);
  console.log(
    `generate-style-modifier: criado .${baseClass}--${value} em ${path.relative(PROJECT_ROOT, cssPath)}`,
  );
  return cssPath;
}

function commitTouchedFile(filePath, name, value) {
  if (!filePath) return;

  execFileSync('git', ['add', filePath], { cwd: PROJECT_ROOT });
  const message = `feat: adiciona modificador de estilo ${value} em ${name}`;
  execFileSync('git', ['commit', '-m', message], { cwd: PROJECT_ROOT });
  console.log(`generate-style-modifier: commit criado — "${message}"`);
}

function main() {
  const [name, prop, value] = process.argv.slice(2);
  if (!name || !prop || !value) {
    console.error(
      'uso: npm run generate:style-modifier -- <positivus-nome> <prop> <valor>',
    );
    return true;
  }

  try {
    const touchedFile = generateStyleModifier(name, prop, value);
    commitTouchedFile(touchedFile, name, value);
    return false;
  } catch (error) {
    console.error(`generate-style-modifier: falhou em ${name}`);
    console.error(error);
    return true;
  }
}

// Só roda o CLI quando o arquivo é executado direto (`npm run
// generate:style-modifier`) — mesma convenção defensiva de
// `generate-component-files.js`.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hasError = main();
  if (hasError) {
    process.exit(1);
  }
}
