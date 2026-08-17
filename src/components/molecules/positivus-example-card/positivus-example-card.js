import { BaseComponent } from '../../base-component.js';
import rawTemplate from './positivus-example-card.html?raw';
import styles from './positivus-example-card.css?inline';
import imgExample from './images/example.svg';

const template = rawTemplate
  .replaceAll('./images/example.svg', imgExample);

export class PositivusExampleCard extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-example-card', PositivusExampleCard);
