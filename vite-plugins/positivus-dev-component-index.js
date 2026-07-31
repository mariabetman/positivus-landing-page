import fs from 'node:fs';
import path from 'node:path';

const COMPONENTS_ROOT = 'src/components';
const LEVELS = ['atoms', 'molecules', 'organisms'];
const INDEX_ROUTE = '/__components';

/**
 * Varre src/components/<nivel>/positivus-<nome>/ procurando componentes
 * (uma pasta com <nome>.html dentro, ver "Convenção para novos componentes"
 * no CLAUDE.md).
 */
function findComponents(projectRoot) {
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

function renderIndexHtml(components, base) {
  const groups = LEVELS.map((level) => ({
    level,
    items: components.filter((component) => component.level === level),
  })).filter((group) => group.items.length > 0);

  const sectionsHtml = groups
    .map(
      (group) => `
      <section>
        <h2 class="title-h4">${group.level}</h2>
        <ul>
          ${group.items
            .map(
              (component) =>
                `<li><a href="${base}__components/${component.level}/${component.name}">${component.name}</a></li>`,
            )
            .join('\n          ')}
        </ul>
      </section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Componentes — Positivus (dev)</title>
    <link rel="stylesheet" href="${base}src/styles/reset.css" />
    <link rel="stylesheet" href="${base}src/styles/global.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${base}src/styles/typograph.css" />
    <style>
      body { margin: 2rem; color: #1a1a1a; }
      h1 { margin-bottom: 0.25rem; }
      p { color: #555; }
      section { margin-top: 1.5rem; }
      h2 { text-transform: capitalize; }
      ul { list-style: none; padding: 0; }
      li { margin: 0.35rem 0; }
      a { text-decoration: none; color: #0b5fff; font-size: 1rem; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <h1 class="title-h1">Componentes</h1>
    <p class="paragraph">Página só de desenvolvimento. Clique em um componente para ver o preview do HTML/CSS dele.</p>
    ${sectionsHtml || '<p>Nenhum componente encontrado ainda.</p>'}
  </body>
</html>
`;
}

/**
 * Gera a página de preview de um componente na hora, lendo o .html/.css
 * dele direto do disco — não depende de nenhum arquivo .preview.html.
 */
function renderComponentPreview(projectRoot, base, level, name) {
  const componentDir = path.join(projectRoot, COMPONENTS_ROOT, level, name);
  const htmlFile = path.join(componentDir, `${name}.html`);
  if (!fs.existsSync(htmlFile)) return null;

  const markup = fs.readFileSync(htmlFile, 'utf-8');
  const cssFile = path.join(componentDir, `${name}.css`);
  const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf-8') : '';

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Preview: ${name}</title>
    <link rel="stylesheet" href="${base}src/styles/reset.css" />
    <link rel="stylesheet" href="${base}src/styles/global.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="${base}src/styles/typograph.css" />
  </head>
  <body>
    <div id="preview-host"></div>
    <script>
      // Cria um Shadow DOM de verdade (igual o BaseComponent real) em vez de
      // colar o HTML numa div normal — assim a regra ":host { ... }" do CSS
      // do componente funciona igual funcionaria no componente de verdade.
      const host = document.getElementById('preview-host');
      const shadow = host.attachShadow({ mode: 'open' });

      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(css)};
      shadow.append(style);

      const template = document.createElement('template');
      template.innerHTML = ${JSON.stringify(markup)};
      shadow.append(template.content.cloneNode(true));
    </script>
  </body>
</html>
`;
}

/**
 * Plugin Vite ativo só em `npm run dev` (apply: 'serve') — não entra no build
 * de produção. Serve, só em dev:
 *   - /__components                     → lista de componentes
 *   - /__components/<nivel>/<nome>      → preview do componente, gerado na
 *                                          hora a partir do .html/.css dele
 */
export function positivusDevComponentIndex() {
  return {
    name: 'positivus-dev-component-index',
    apply: 'serve',
    configureServer(server) {
      // Registrado direto no corpo do hook (sem retornar uma função), então
      // roda ANTES dos middlewares internos do Vite — inclusive o fallback
      // de SPA, que senão intercepta a rota antes dela chegar aqui. Por
      // rodar antes do middleware de `base` também, o req.url ainda vem com
      // o prefixo do base, então o match precisa incluir ele.
      const base = server.config.base;
      const routeWithBase = `${base.replace(/\/$/, '')}${INDEX_ROUTE}`;

      server.middlewares.use((req, res, next) => {
        const pathname = req.url
          ? req.url.split('?')[0].replace(/\/$/, '')
          : '';

        if (pathname === routeWithBase) {
          const components = findComponents(server.config.root);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(renderIndexHtml(components, base));
          return;
        }

        if (pathname.startsWith(`${routeWithBase}/`)) {
          const [level, name] = pathname
            .slice(routeWithBase.length + 1)
            .split('/');
          const preview =
            LEVELS.includes(level) && name
              ? renderComponentPreview(server.config.root, base, level, name)
              : null;

          if (preview) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(preview);
          } else {
            res.statusCode = 404;
            res.end(`Componente não encontrado: ${level}/${name}`);
          }
          return;
        }

        next();
      });
    },
  };
}
