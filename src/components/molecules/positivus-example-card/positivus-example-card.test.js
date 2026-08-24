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
    expect(el.shadowRoot.querySelector('.card__image')).not.toBeNull();

    el.remove();
  });

  it('overrides title and text via attribute', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('title', 'Consultoria de SEO');
    el.setAttribute('text', 'Aumente o tráfego orgânico do seu site.');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__title').textContent).toBe(
      'Consultoria de SEO',
    );
    expect(el.shadowRoot.querySelector('.card__text').textContent).toBe(
      'Aumente o tráfego orgânico do seu site.',
    );

    el.remove();
  });

  it('overrides the image via attribute', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('image', 'https://example.com/icon.png');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__image').src).toBe(
      'https://example.com/icon.png',
    );

    el.remove();
  });

  it('overrides the image alt text via attribute', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('image', 'https://example.com/icon.png');
    el.setAttribute('image-alt', 'Foto do produto');
    document.body.append(el);

    const image = el.shadowRoot.querySelector('.card__image');
    expect(image.src).toBe('https://example.com/icon.png');
    expect(image.alt).toBe('Foto do produto');

    el.remove();
  });
});
