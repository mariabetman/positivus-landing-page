import { describe, expect, it } from 'vitest';
import './positivus-button.js';

describe('positivus-button', () => {
  it('registers the custom element', () => {
    expect(customElements.get('positivus-button')).toBeDefined();
  });
});
