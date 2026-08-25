import { BaseComponent } from '../../base-component.js';
import template from './positivus-button.html?raw';
import styles from './positivus-button.css?inline';

export class PositivusButton extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-button', PositivusButton);
