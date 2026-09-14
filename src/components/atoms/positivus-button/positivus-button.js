import { BaseComponent } from '../../base-component.js';
import template from './positivus-button.html?raw';
import styles from './positivus-button.css?inline';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export class PositivusButton extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template, variantFiles);

  constructor() {
    super({ template, styles, variantFiles });
  }
}

customElements.define('positivus-button', PositivusButton);
