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
    el.setAttribute('src', 'https://example.com/icon.png');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__image').src).toBe(
      'https://example.com/icon.png',
    );

    el.remove();
  });

  it('overrides the image alt text via attribute', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('src', 'https://example.com/icon.png');
    el.setAttribute('alt', 'Foto do produto');
    document.body.append(el);

    const image = el.shadowRoot.querySelector('.card__image');
    expect(image.src).toBe('https://example.com/icon.png');
    expect(image.alt).toBe('Foto do produto');

    el.remove();
  });

  it('overrides the "Saiba mais" link href independently, via the href attribute', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('href', 'https://exemplo.com/produto');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__link').getAttribute('href')).toBe(
      'https://exemplo.com/produto',
    );
    expect(el.shadowRoot.querySelector('.card__image-link').getAttribute('href')).toBe('#');

    el.remove();
  });

  it('overrides the image link href independently, via the image-href attribute', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('image-href', 'https://exemplo.com/galeria');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__image-link').getAttribute('href')).toBe(
      'https://exemplo.com/galeria',
    );
    expect(el.shadowRoot.querySelector('.card__link').getAttribute('href')).toBe('#');

    el.remove();
  });

  it('accepts two independent hrefs at the same time, one for each link', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('href', 'https://exemplo.com/produto');
    el.setAttribute('image-href', 'https://exemplo.com/galeria');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__link').getAttribute('href')).toBe(
      'https://exemplo.com/produto',
    );
    expect(el.shadowRoot.querySelector('.card__image-link').getAttribute('href')).toBe(
      'https://exemplo.com/galeria',
    );

    el.remove();
  });

  it('renders only the compact variant when variant="compact"', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('variant', 'compact');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__title').textContent).toBe(
      'Example Card',
    );
    expect(el.shadowRoot.querySelector('.card--compact')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.card__image')).toBeNull();

    el.remove();
  });

  it('applies title/text to whichever variant is currently rendered', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('variant', 'compact');
    el.setAttribute('title', 'Newsletter');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__title').textContent).toBe(
      'Newsletter',
    );

    el.remove();
  });

  it('re-renders the correct block when the variant attribute changes', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('title', 'Consultoria de SEO');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__image')).not.toBeNull();

    el.setAttribute('variant', 'compact');

    expect(el.shadowRoot.querySelector('.card__image')).toBeNull();
    expect(el.shadowRoot.querySelector('.card__title').textContent).toBe(
      'Consultoria de SEO',
    );

    el.remove();
  });

  it('falls back to the default variant when an invalid variant is passed', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('variant', 'nao-existe');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.card__image')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.card--compact')).toBeNull();

    el.remove();
  });

  it('renders the highlight appearance as a modifier class, on top of the default variant', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('appearance', 'highlight');
    document.body.append(el);

    const card = el.shadowRoot.querySelector('.card');
    expect(card.classList.contains('card--highlight')).toBe(true);
    expect(card.classList.contains('card--compact')).toBe(false);
    expect(el.shadowRoot.querySelector('.card__image')).not.toBeNull();

    el.remove();
  });

  it('combines variant=compact and appearance=highlight at the same time', () => {
    const el = document.createElement('positivus-example-card');
    el.setAttribute('variant', 'compact');
    el.setAttribute('appearance', 'highlight');
    document.body.append(el);

    const card = el.shadowRoot.querySelector('.card');
    expect(card.classList.contains('card--compact')).toBe(true);
    expect(card.classList.contains('card--highlight')).toBe(true);
    expect(el.shadowRoot.querySelector('.card__image')).toBeNull();

    el.remove();
  });

  it('does not add the highlight modifier when appearance is left at its default', () => {
    const el = document.createElement('positivus-example-card');
    document.body.append(el);

    expect(
      el.shadowRoot.querySelector('.card').classList.contains('card--highlight'),
    ).toBe(false);

    el.remove();
  });
});
