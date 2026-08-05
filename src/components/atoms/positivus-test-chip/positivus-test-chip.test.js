import { describe, expect, it } from 'vitest';
import './positivus-test-chip.js';

describe('positivus-test-chip', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-test-chip')).toBeDefined();
  });
});
