import { describe, expect, it } from 'vitest';
import './positivus-cta-banner.js';

describe('positivus-cta-banner', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-cta-banner')).toBeDefined();
  });
});
