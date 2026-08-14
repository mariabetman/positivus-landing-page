import fs from 'node:fs';
import path from 'node:path';
import {
  COMPONENTS_ROOT,
  findComponents,
  isLocalImageSrc,
} from '../scripts/lib/component-files.js';

const STYLES_ROOT = 'src/styles';
const INDEX_ROUTE = '/__components';
const IMG_SRC_ATTRIBUTE_PATTERN = /(<img\b[^>]*\ssrc\s*=\s*["'])([^"']+)(["'])/gi;
const HEAD_CONTENT_PATTERN = /<head[^>]*>([\s\S]*?)<\/head>/i;
const TITLE_TAG_PATTERN = /<title>[\s\S]*?<\/title>/i;
const HREF_OR_SRC_ATTRIBUTE_PATTERN = /((?:href|src)\s*=\s*["'])([^"']+)(["'])/gi;

/**
 * Reaproveita o <head> do index.html real (viewport, favicon, title, links
 * de CSS/fonts) em vez de manter uma cópia à mão aqui — qualquer coisa nova
 * adicionada ao <head> do site (uma tag, um novo CSS global, etc.) passa a
 * aparecer nas páginas de dev sozinha, sem precisar editar este plugin. Só
 * o <title> é sobrescrito, já que aqui é uma página diferente do site real.
 *
 * Um `href`/`src` relativo tipo `./favicon.svg` funciona no index.html real
 * porque ele mora na raiz do site; nas rotas de preview (que podem estar
 * 2+ níveis "abaixo" de /__components) o mesmo relativo resolveria errado.
 * Convertemos pra absoluto a partir da raiz (`/favicon.svg`) e deixamos o
 * `server.transformIndexHtml` (chamado por quem usa este HTML) adicionar o
 * `base` sozinho — é o que ele já faz com os `/src/...` do próprio
 * index.html, então não fazemos isso à mão aqui pra não duplicar o prefixo.
 */
function readIndexHeadHtml(projectRoot, title) {
  const indexHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
  const match = HEAD_CONTENT_PATTERN.exec(indexHtml);
  const headContent = match ? match[1] : '';

  const withTitle = headContent.replace(TITLE_TAG_PATTERN, `<title>${title}</title>`);

  return withTitle.replace(
    HREF_OR_SRC_ATTRIBUTE_PATTERN,
    (full, prefix, url, suffix) => {
      if (!isLocalImageSrc(url)) return full;

      const relativePath = url.replace(/^\.\//, '');
      return `${prefix}/${relativePath}${suffix}`;
    },
  );
}

function renderIndexHtml(components, base, projectRoot) {
  const levels = [...new Set(components.map((component) => component.level))];
  const groups = levels
    .map((level) => ({
      level,
      items: components.filter((component) => component.level === level),
    }))
    .filter((group) => group.items.length > 0);

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
    ${readIndexHeadHtml(projectRoot, 'Componentes — Positivus (dev)')}
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
 * No componente real, um `<img src="./images/x.svg">` vira um import do
 * Vite (ver npm run generate:image-imports) que resolve pra a URL de dev do
 * asset. Como este preview injeta o .html cru (sem passar pelo .js nem pelo
 * pipeline de import), reescrevemos aqui os `src` locais pra apontar direto
 * pro arquivo dentro da pasta do componente — senão o navegador resolve o
 * caminho relativo contra a URL do preview (/__components/<nivel>/<nome>),
 * que não existe no disco, e a imagem quebra.
 */
function resolveComponentImageSrcs(markup, assetBaseUrl) {
  return markup.replace(
    IMG_SRC_ATTRIBUTE_PATTERN,
    (full, prefix, src, suffix) => {
      if (!isLocalImageSrc(src)) return full;

      const relativePath = src.replace(/^\.\//, '');
      return `${prefix}${assetBaseUrl}/${relativePath}${suffix}`;
    },
  );
}

function readStyle(projectRoot, fileName) {
  return fs.readFileSync(path.join(projectRoot, STYLES_ROOT, fileName), 'utf-8');
}

/**
 * src/styles/reset.css é só `@import 'eric-meyer-reset/...'` (mais qualquer
 * regra extra que alguém adicione ali). Diferente do BaseComponent real, que
 * importa esse arquivo via pipeline do Vite (resolve o @import sozinho), este
 * plugin lê o arquivo cru do disco — um @import com specifier de pacote (não
 * uma URL relativa) não é algo que o navegador consiga resolver dentro da
 * <style> desta página. Por isso resolvemos manualmente: injeta o CSS real
 * do pacote e remove a linha de @import do restante do arquivo.
 */
function readResetCss(projectRoot) {
  const raw = readStyle(projectRoot, 'reset.css');
  const withoutImport = raw.replace(/@import\s+['"][^'"]+['"]\s*;/, '');
  const meyerResetCss = fs.readFileSync(
    path.join(projectRoot, 'node_modules/eric-meyer-reset/eric-meyer-reset.css'),
    'utf-8',
  );

  return `${meyerResetCss}\n${withoutImport}`;
}

/**
 * Gera a página de preview de um componente na hora, lendo o .html/.css
 * dele direto do disco — não depende de nenhum arquivo .preview.html.
 */
function renderComponentPreview(projectRoot, base, level, name) {
  const componentDir = path.join(projectRoot, COMPONENTS_ROOT, level, name);
  const htmlFile = path.join(componentDir, `${name}.html`);
  if (!fs.existsSync(htmlFile)) return null;

  const assetBaseUrl = `${base}${COMPONENTS_ROOT}/${level}/${name}`;
  const markup = resolveComponentImageSrcs(
    fs.readFileSync(htmlFile, 'utf-8'),
    assetBaseUrl,
  );
  const cssFile = path.join(componentDir, `${name}.css`);
  const ownCss = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf-8') : '';

  // Mesma ordem que o BaseComponent real adota no Shadow DOM (ver
  // src/components/base-component.js): reset, tipografia, global e só então
  // o CSS do próprio componente.
  const css = `${readResetCss(projectRoot)}\n${readStyle(projectRoot, 'typograph.css')}\n${readStyle(projectRoot, 'global.css')}\n${ownCss}`;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    ${readIndexHeadHtml(projectRoot, `Preview: ${name}`)}
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

      server.middlewares.use(async (req, res, next) => {
        const pathname = req.url
          ? req.url.split('?')[0].replace(/\/$/, '')
          : '';

        if (pathname === routeWithBase) {
          const components = findComponents(server.config.root);
          const html = await server.transformIndexHtml(
            req.url,
            renderIndexHtml(components, base, server.config.root),
          );
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(html);
          return;
        }

        if (pathname.startsWith(`${routeWithBase}/`)) {
          const [level, name] = pathname
            .slice(routeWithBase.length + 1)
            .split('/');
          const preview =
            level && name
              ? renderComponentPreview(server.config.root, base, level, name)
              : null;

          if (preview) {
            const html = await server.transformIndexHtml(req.url, preview);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(html);
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
