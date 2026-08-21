import { BaseComponent } from '../../base-component.js';
import template from './positivus-title-and-description.html?raw';
import styles from './positivus-title-and-description.css?inline';

export class PositivusTitleAndDescription extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-title-and-description', PositivusTitleAndDescription);
