import reset from '../styles/reset.css?inline';
import typograph from '../styles/typograph.css?inline';
import global from '../styles/global.css?inline';

const resetStylesheet = new CSSStyleSheet();
resetStylesheet.replaceSync(reset);

const typographStylesheet = new CSSStyleSheet();
typographStylesheet.replaceSync(typograph);

const globalStylesheet = new CSSStyleSheet();
globalStylesheet.replaceSync(global);

export class BaseComponent extends HTMLElement {
  constructor({ template = '', styles = '' } = {}) {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.adoptedStyleSheets = [
      resetStylesheet,
      typographStylesheet,
      globalStylesheet,
    ];

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
