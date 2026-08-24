import './positivus-example-card-compact.js';
import template from './positivus-example-card-compact.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Molecules/PositivusExampleCardCompact',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-example-card-compact'),
};

export const Default = {
  args: {},
};
