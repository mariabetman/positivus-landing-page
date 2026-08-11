import { describe, expect, it } from 'vitest';
import './positivus-companies-logo.js';

describe('positivus-companies-logo', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-companies-logo')).toBeDefined();
  });
});
