export class BaseComponent extends HTMLElement {
  constructor({ template = '', styles = '' } = {}) {
    super();
    this.attachShadow({ mode: 'open' });

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
    this.shadowRoot.adoptedStyleSheets = [stylesheet];
  }

  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
}
