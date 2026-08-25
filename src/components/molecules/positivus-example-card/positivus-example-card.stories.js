import './positivus-example-card.js';
import template from './positivus-example-card.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Molecules/PositivusExampleCard',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-example-card'),
};

export const Default = {
  args: {},
};

export const CustomContent = {
  args: {
    title: 'Consultoria de SEO',
    text: 'Aumente o tráfego orgânico do seu site com estratégias personalizadas.',
  },
};

export const Highlight = {
  args: {
    tone: 'highlight',
    title: 'Marketing de Conteúdo',
    text: 'Conte a história da sua marca com conteúdo relevante e envolvente.',
  },
};

export const Compact = {
  args: {
    variant: 'compact',
    title: 'Newsletter',
    text: 'Receba novidades por e-mail.',
  },
};

export const CompactHighlight = {
  args: { variant: 'compact', tone: 'highlight' },
};
