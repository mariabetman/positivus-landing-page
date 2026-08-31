import { BaseComponent } from '../../base-component.js';
import template from './positivus-cta-banner.html?raw';
import styles from './positivus-cta-banner.css?inline';

export class PositivusCtaBanner extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-cta-banner', PositivusCtaBanner);
