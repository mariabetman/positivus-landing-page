import { BaseComponent } from '../../base-component.js';
import template from './positivus-example-card.html?raw';
import styles from './positivus-example-card.css?inline';
import '../../atoms/positivus-button/positivus-button.js';

export class PositivusExampleCard extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-example-card', PositivusExampleCard);
