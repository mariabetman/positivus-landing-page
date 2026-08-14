import { BaseComponent } from '../../base-component.js';
import template from './positivus-companies-logo.html?raw';
import styles from './positivus-companies-logo.css?inline';
import imgAmazonLogo from './images/amazon-logo.png';
import imgDribbleLogo from './images/dribble-logo.png';
import imgHubspotLogo from './images/hubspot-logo.png';
import imgNetflixLogo from './images/netflix-logo.png';
import imgNotionLogo from './images/notion-logo.png';
import imgZoomLogo from './images/zoom-logo.png';

export class PositivusCompaniesLogo extends BaseComponent {
  constructor() {
    super({ template, styles });
    this.$$('img[src="./images/amazon-logo.png"]').forEach((img) => {
      img.src = imgAmazonLogo;
    });
    this.$$('img[src="./images/dribble-logo.png"]').forEach((img) => {
      img.src = imgDribbleLogo;
    });
    this.$$('img[src="./images/hubspot-logo.png"]').forEach((img) => {
      img.src = imgHubspotLogo;
    });
    this.$$('img[src="./images/netflix-logo.png"]').forEach((img) => {
      img.src = imgNetflixLogo;
    });
    this.$$('img[src="./images/notion-logo.png"]').forEach((img) => {
      img.src = imgNotionLogo;
    });
    this.$$('img[src="./images/zoom-logo.png"]').forEach((img) => {
      img.src = imgZoomLogo;
    });
  }
}

customElements.define('positivus-companies-logo', PositivusCompaniesLogo);
