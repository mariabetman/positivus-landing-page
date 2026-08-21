import { BaseComponent } from '../../base-component.js';
import template from './positivus-companies-logo.html?raw';
import styles from './positivus-companies-logo.css?inline';

export class PositivusCompaniesLogo extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-companies-logo', PositivusCompaniesLogo);
