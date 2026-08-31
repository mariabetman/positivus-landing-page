import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Caminho absoluto (em vez de relativo, "../src/...") pro glob de stories —
// necessário porque o .storybook/ fica numa subpasta e o glob sobe um nível;
// com caminho relativo, o builder-vite gera chaves de import inconsistentes
// entre o mapa de módulos e o índice de stories, e todo preview quebra com
// "importers[path] is not a function" (bug conhecido do @storybook/builder-vite
// nesse cenário: https://github.com/storybookjs/builder-vite/issues/554).
const storiesGlob = path
  .join(path.dirname(fileURLToPath(import.meta.url)), '../src/components/**/*.stories.js')
  .replace(/\\/g, '/');

/** @type {import('@storybook/web-components-vite').StorybookConfig} */
const config = {
  stories: [storiesGlob],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
};

export default config;
