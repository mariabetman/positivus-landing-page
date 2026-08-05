import { BaseComponent } from '../../base-component.js';
import template from './positivus-test-chip.html?raw';
import styles from './positivus-test-chip.css?inline';

export class PositivusTestChip extends BaseComponent {
  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-test-chip', PositivusTestChip);
