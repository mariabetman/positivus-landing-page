import reset from '../styles/reset.css?inline';
import typograph from '../styles/typograph.css?inline';
import global from '../styles/global.css?inline';

const resetStylesheet = new CSSStyleSheet();
resetStylesheet.replaceSync(reset);

const typographStylesheet = new CSSStyleSheet();
typographStylesheet.replaceSync(typograph);

const globalStylesheet = new CSSStyleSheet();
globalStylesheet.replaceSync(global);

const PROP_ATTRIBUTE_PATTERN = /data-prop(?:-[a-z-]+)?\s*=\s*["']([^"']+)["']/g;
const PROP_DATA_ATTRIBUTE_PATTERN = /^data-prop(?:-toggle-(.+)|-(.+))?$/;

export class BaseComponent extends HTMLElement {
  #propBindings = new Map();

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
      this.#bindProps();
    }
  }

  attributeChangedCallback(name) {
    const value = this.getAttribute(name);
    if (value === null) return;

    const binding = this.#propBindings.get(name);
    if (!binding) return;

    const { element, target, isToggle } = binding;
    if (target === 'text') {
      element.textContent = value;
    } else if (isToggle) {
      // Atributo booleano de HTML (disabled, checked, required...) é
      // "verdadeiro" só por existir — setAttribute(target, 'false') ainda
      // deixaria o atributo presente. toggleAttribute adiciona/remove de
      // verdade, interpretando o valor como "true"/"false".
      element.toggleAttribute(target, value === 'true');
    } else {
      element.setAttribute(target, value);
    }
  }

  /**
   * `data-prop="nome"` (sem sufixo) aplica o valor em `textContent`.
   * `data-prop-<atributo>="nome"` aplica em qualquer atributo do elemento
   * (`data-prop-src`, `data-prop-alt`, `data-prop-href`, `data-prop-aria-label`,
   * etc.) via `setAttribute` — funciona pra qualquer atributo HTML padrão,
   * sem precisar ensinar o `BaseComponent` sobre cada tipo de elemento.
   * `data-prop-toggle-<atributo>="nome"` é a variante pra atributo
   * booleano (`disabled`, `checked`, `required`...): o valor "true"/"false"
   * decide se o atributo existe ou não, em vez de virar o texto dele.
   */
  #bindProps() {
    this.shadowRoot.querySelectorAll('*').forEach((element) => {
      for (const attribute of element.attributes) {
        const match = PROP_DATA_ATTRIBUTE_PATTERN.exec(attribute.name);
        if (!match) continue;

        const [, toggleTarget, target] = match;
        const binding = toggleTarget
          ? { element, target: toggleTarget, isToggle: true }
          : { element, target: target ?? 'text', isToggle: false };
        this.#propBindings.set(attribute.value, binding);
      }
    });
  }

  /**
   * Lê os nomes de prop (`data-prop`/`data-prop-<atributo>`) presentes num
   * template — usado por cada componente pra declarar
   * `static observedAttributes`, já que esse getter é obrigatório pro
   * navegador saber quais atributos observar e chamar
   * `attributeChangedCallback`.
   */
  static extractPropNames(template) {
    return [
      ...new Set(
        [...template.matchAll(PROP_ATTRIBUTE_PATTERN)].map(
          (match) => match[1],
        ),
      ),
    ];
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
