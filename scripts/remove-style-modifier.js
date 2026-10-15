import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import {
  findComponents,
  readComponentHtmlSources,
  findModifierBaseClassAcrossSources,
  structuralVariantValues,
  escapeRegExp,
} from './lib/component-files.js';

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

function buildRulePattern(baseClass, value) {
  return new RegExp(
    `\\n?[ \\t]*\\.${escapeRegExp(baseClass)}--${escapeRegExp(value)}[ \\t]*\\{([^}]*)\\}[ \\t]*\\n?`,
  );
}

/**
 * Acha todo valor de `.<classe-base>--<valor>` já escrito no `.css` —
 * mesmo critério de `readModifierAxes` (exclui valor que pertence à
 * variante estrutural, ex: `card--compact`, que não tem nada a ver com
 * `data-prop-modifier`).
 */
function findExistingValues(css, baseClass, componentDir) {
  const pattern = new RegExp(
    `\\.${escapeRegExp(baseClass)}--([a-zA-Z0-9_-]+)(?=\\s*[,{])`,
    'g',
  );
  const excluded = structuralVariantValues(componentDir);

  return [
    ...new Set(
      [...css.matchAll(pattern)]
        .map((match) => match[1])
        .filter((value) => !excluded.has(value)),
    ),
  ].sort();
}

/**
 * Remove a regra `.<classe-base>--<valor>` do `.css` de um componente —
 * contraparte de `generate-style-modifier.js`. Sem `value`, remove **todas**
 * as regras daquele prop de uma vez. Por padrão recusa remover uma regra
 * que já tenha CSS de verdade escrito dentro (só `--force` força) — evita
 * apagar estilo sem querer.
 *
 * @returns {string | null} caminho do .css atualizado, ou null se nada mudou
 */
function removeStyleModifier(name, prop, value, force) {
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
  const cssPath = path.join(componentDir, `${name}.css`);
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf-8') : '';

  const sources = readComponentHtmlSources(componentDir, name);
  const baseClass = findModifierBaseClassAcrossSources(sources, prop);
  if (!baseClass) {
    throw new Error(
      `nenhum elemento com data-prop-modifier="${prop}" (e uma classe) encontrado em ${name}.html nem em variants/variant/`,
    );
  }

  const values = value
    ? [value]
    : findExistingValues(css, baseClass, componentDir);

  if (values.length === 0) {
    console.log(
      `remove-style-modifier: nenhuma regra de "${prop}" encontrada em ${name}.css, nada a fazer`,
    );
    return null;
  }

  // Primeiro só confere (sem remover nada ainda) — se alguma regra tiver
  // conteúdo real e não veio --force, aborta inteiro, sem mexer em nenhuma
  // das outras, pra não deixar o CSS num estado parcialmente removido.
  const withContent = [];
  for (const currentValue of values) {
    const match = css.match(buildRulePattern(baseClass, currentValue));
    if (match && match[1].trim() !== '') {
      withContent.push(currentValue);
    }
  }

  if (withContent.length > 0 && !force) {
    throw new Error(
      `${withContent.map((v) => `.${baseClass}--${v}`).join(', ')} já tem CSS escrito dentro — use --force pra remover mesmo assim`,
    );
  }

  let updatedCss = css;
  let removedAny = false;
  for (const currentValue of values) {
    const pattern = buildRulePattern(baseClass, currentValue);
    if (pattern.test(updatedCss)) {
      updatedCss = updatedCss.replace(pattern, '\n');
      removedAny = true;
      console.log(
        `remove-style-modifier: removido .${baseClass}--${currentValue} de ${path.relative(PROJECT_ROOT, cssPath)}`,
      );
    } else if (value) {
      console.log(
        `remove-style-modifier: .${baseClass}--${currentValue} não existe em ${name}.css, nada a fazer`,
      );
    }
  }

  if (!removedAny) return null;

  fs.writeFileSync(cssPath, updatedCss.replace(/\n{3,}/g, '\n\n'));
  return cssPath;
}

function commitTouchedFile(filePath, name, prop, value) {
  if (!filePath) return;

  execFileSync('git', ['add', filePath], { cwd: PROJECT_ROOT });
  const message = value
    ? `chore: remove modificador de estilo ${value} de ${name}`
    : `chore: remove todos os modificadores de estilo de ${prop} em ${name}`;
  execFileSync('git', ['commit', '-m', message], { cwd: PROJECT_ROOT });
  console.log(`remove-style-modifier: commit criado — "${message}"`);
}

function main() {
  const rawArgs = process.argv.slice(2);
  const force = rawArgs.includes('--force');
  const [name, prop, value] = rawArgs.filter((arg) => arg !== '--force');

  if (!name || !prop) {
    console.error(
      'uso: npm run remove:style-modifier -- <positivus-nome> <prop> [valor] [--force]',
    );
    return true;
  }

  try {
    const touchedFile = removeStyleModifier(name, prop, value, force);
    commitTouchedFile(touchedFile, name, prop, value);
    return false;
  } catch (error) {
    console.error(`remove-style-modifier: falhou em ${name}`);
    console.error(error);
    return true;
  }
}

// Só roda o CLI quando o arquivo é executado direto (`npm run
// remove:style-modifier`) — mesma convenção defensiva dos outros scripts.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hasError = main();
  if (hasError) {
    process.exit(1);
  }
}
