import { describe, expect, it } from 'vitest';
import './positivus-card-list.js';

describe('positivus-card-list', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-card-list')).toBeDefined();
  });
});
