import './positivus-card-list.js';
import template from './positivus-card-list.html?raw';
import { argTypesFromTemplate, renderWithArgs } from '../../storybook-helpers.js';

export default {
  title: 'Organisms/PositivusCardList',
  tags: ['autodocs'],
  argTypes: argTypesFromTemplate(template),
  render: renderWithArgs('positivus-card-list'),
};

export const Default = {
  args: {},
};
