import reset from '../styles/reset.css?inline';
import typograph from '../styles/typograph.css?inline';

const resetStylesheet = new CSSStyleSheet();
resetStylesheet.replaceSync(reset);

const typographStylesheet = new CSSStyleSheet();
typographStylesheet.replaceSync(typograph);

export class BaseComponent extends HTMLElement {
  constructor({ template = '', styles = '' } = {}) {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [resetStylesheet, typographStylesheet];

    if (styles) {
      this.#adoptStylesheet(styles);
    }

    if (template) {
      this.shadowRoot.innerHTML = template;
    }
  }

  #adoptStylesheet(cssText) {
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(cssText);
    this.shadowRoot.adoptedStyleSheets = [
      ...this.shadowRoot.adoptedStyleSheets,
      stylesheet,
    ];
  }

  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
}
