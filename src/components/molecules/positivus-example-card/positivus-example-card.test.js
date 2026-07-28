import { describe, expect, it } from 'vitest';
import './positivus-example-card.js';

describe('positivus-example-card', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-example-card')).toBeDefined();
  });

  it('renders the card markup inside its Shadow DOM', () => {
    const el = document.createElement('positivus-example-card');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__title').textContent).toBe('Example Card');
    expect(el.shadowRoot.querySelector('.card__text').textContent).toBe(
      'Este é um componente de exemplo.',
    );

    el.remove();
  });
});
