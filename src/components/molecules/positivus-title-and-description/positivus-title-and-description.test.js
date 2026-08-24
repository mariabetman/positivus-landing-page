import { describe, expect, it } from 'vitest';
import './positivus-title-and-description.js';

describe('positivus-title-and-description', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-title-and-description')).toBeDefined();
  });
});
