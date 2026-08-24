import { describe, expect, it } from 'vitest';
import './positivus-example-card-compact.js';

describe('positivus-example-card-compact', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-example-card-compact')).toBeDefined();
  });
});
