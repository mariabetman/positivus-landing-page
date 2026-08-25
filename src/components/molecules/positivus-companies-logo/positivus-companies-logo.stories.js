import './positivus-companies-logo.js';
import template from './positivus-companies-logo.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Molecules/PositivusCompaniesLogo',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-companies-logo'),
};

export const Default = {
  args: {},
};
