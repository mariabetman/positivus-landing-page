import { describe, expect, it } from 'vitest';
import './positivus-card-list.js';

describe('positivus-card-list', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-card-list')).toBeDefined();
  });

  it('renders a positivus-example-card for each item, with the right title', () => {
    const el = document.createElement('positivus-card-list');
    document.body.append(el);

    const cards = el.shadowRoot.querySelectorAll('positivus-example-card');
    expect(cards).toHaveLength(3);
    expect(cards[0].getAttribute('title')).toBe('Consultoria de SEO');
    expect(cards[0].getAttribute('href')).toBe('#consultoria-de-seo');
    expect(cards[0].getAttribute('image-href')).toBe('#consultoria-de-seo-galeria');
    expect(cards[2].getAttribute('appearance')).toBe('highlight');

    el.remove();
  });
});
