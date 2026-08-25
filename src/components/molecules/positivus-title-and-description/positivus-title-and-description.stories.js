import './positivus-title-and-description.js';
import template from './positivus-title-and-description.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Molecules/PositivusTitleAndDescription',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-title-and-description'),
};

export const Default = {
  args: {},
};
