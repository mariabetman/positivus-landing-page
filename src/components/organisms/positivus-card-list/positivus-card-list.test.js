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
    expect(cards).toHaveLength(4);
    expect(cards[0].getAttribute('title')).toBe('Consultoria de SEO');
    expect(cards[0].getAttribute('href')).toBe('#consultoria-de-seo');
    expect(cards[0].getAttribute('image-href')).toBe('#consultoria-de-seo-galeria');
    expect(cards[1].getAttribute('src')).toBe('./assets/logos/hubspot-logo.png');
    expect(cards[1].getAttribute('alt')).toBe('Logo do HubSpot');
    expect(cards[2].getAttribute('appearance')).toBe('highlight');
    expect(cards[3].getAttribute('variant')).toBe('compact');
    expect(cards[3].getAttribute('title')).toBe('Newsletter');

    el.remove();
  });
});
