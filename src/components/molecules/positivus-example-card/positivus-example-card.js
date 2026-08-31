import { BaseComponent } from '../../base-component.js';
import template from './positivus-example-card.html?raw';
import styles from './positivus-example-card.css?inline';

const variantFiles = import.meta.glob('./variants/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});

export class PositivusExampleCard extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template, variantFiles);

  constructor() {
    super({ template, styles, variantFiles });
  }
}

customElements.define('positivus-example-card', PositivusExampleCard);
