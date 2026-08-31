import './positivus-example-card.js';
import template from './positivus-example-card.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export default {
  title: 'Molecules/PositivusExampleCard',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template, variantFiles),
  render: renderWithArgs('positivus-example-card'),
};

export const Default = {
  args: {},
};

export const CustomContent = {
  args: {
    title: 'Consultoria de SEO',
    text: 'Aumente o tráfego orgânico do seu site com estratégias personalizadas.',
    href: 'https://exemplo.com/consultoria-seo',
    'image-href': 'https://exemplo.com/consultoria-seo/galeria',
  },
};

export const Compact = {
  args: {
    variant: 'compact',
    title: 'Newsletter',
    text: 'Receba novidades por e-mail.',
  },
};
