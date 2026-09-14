import './positivus-button.js';
import template from './positivus-button.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export default {
  title: 'Atoms/PositivusButton',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template, variantFiles),
  render: renderWithArgs('positivus-button'),
};

export const Default = {
  args: {},
};
