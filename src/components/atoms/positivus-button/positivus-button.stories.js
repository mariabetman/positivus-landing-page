import './positivus-button.js';
import template from './positivus-button.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Atoms/PositivusButton',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-button'),
};

export const Default = {
  args: {},
};

export const Button = {
  args: { variant: 'button' },
};
