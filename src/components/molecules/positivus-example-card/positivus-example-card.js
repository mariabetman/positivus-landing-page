import { BaseComponent } from '../../base-component.js';
import template from './positivus-example-card.html?raw';
import styles from './positivus-example-card.css?inline';
import imgExample from './images/example.svg';

export class PositivusExampleCard extends BaseComponent {
  constructor() {
    super({ template, styles });
    this.$$('img[src="./images/example.svg"]').forEach((img) => {
      img.src = imgExample;
    });
  }
}

customElements.define('positivus-example-card', PositivusExampleCard);
