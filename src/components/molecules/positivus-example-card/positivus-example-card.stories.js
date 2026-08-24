import './positivus-example-card.js';

export default {
  title: 'Molecules/PositivusExampleCard',
  tags: ['autodocs'],
};

export const Default = {
  render: () => document.createElement('positivus-example-card'),
};

export const CustomContent = {
  render: () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('title', 'Consultoria de SEO');
    el.setAttribute(
      'text',
      'Aumente o tráfego orgânico do seu site com estratégias personalizadas.',
    );
    return el;
  },
};
