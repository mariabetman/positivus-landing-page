import { BaseComponent } from '../../base-component.js';
import template from './positivus-example-card-compact.html?raw';
import styles from './positivus-example-card-compact.css?inline';

export class PositivusExampleCardCompact extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-example-card-compact', PositivusExampleCardCompact);
