import { BaseComponent } from '../../base-component.js';
import template from './positivus-card-list.html?raw';
import styles from './positivus-card-list.css?inline';

export class PositivusCardList extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-card-list', PositivusCardList);
