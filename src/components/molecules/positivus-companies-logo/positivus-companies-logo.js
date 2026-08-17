import { BaseComponent } from '../../base-component.js';
import rawTemplate from './positivus-companies-logo.html?raw';
import styles from './positivus-companies-logo.css?inline';
import imgAmazonLogo from './images/amazon-logo.png';
import imgDribbleLogo from './images/dribble-logo.png';
import imgHubspotLogo from './images/hubspot-logo.png';
import imgNetflixLogo from './images/netflix-logo.png';
import imgNotionLogo from './images/notion-logo.png';
import imgZoomLogo from './images/zoom-logo.png';

const template = rawTemplate
  .replaceAll('./images/amazon-logo.png', imgAmazonLogo)
  .replaceAll('./images/dribble-logo.png', imgDribbleLogo)
  .replaceAll('./images/hubspot-logo.png', imgHubspotLogo)
  .replaceAll('./images/netflix-logo.png', imgNetflixLogo)
  .replaceAll('./images/notion-logo.png', imgNotionLogo)
  .replaceAll('./images/zoom-logo.png', imgZoomLogo);

export class PositivusCompaniesLogo extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template, styles });
  }
}

customElements.define('positivus-companies-logo', PositivusCompaniesLogo);
