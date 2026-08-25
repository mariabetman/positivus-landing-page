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
const VARIANT_ATTRIBUTE_PATTERN = /data-variant(?:-([a-z-]+))?\s*=\s*["']([^"']+)["']/g;

export class BaseComponent extends HTMLElement {
  #propBindings = new Map();
  #template = '';
  #variantAxes = [];
  #variantAxisNames = new Set();

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
      this.#template = template;
      this.#variantAxes = BaseComponent.extractVariantAxes(template);
      this.#variantAxisNames = new Set(this.#variantAxes.map((axis) => axis.name));
      this.#renderTemplate();
    }
  }

  attributeChangedCallback(name) {
    if (this.#variantAxisNames.has(name)) {
      this.#renderTemplate();
      return;
    }

    this.#applyProp(name);
  }

  #applyProp(name) {
    const value = this.getAttribute(name);
    if (value === null) return;

    const binding = this.#propBindings.get(name);
    if (!binding) return;

    const { element, target, isToggle } = binding;
    if (target === null) {
      // Sem sufixo (data-prop="nome") — target null é o sinal de "sem
      // atributo específico, é pra aplicar em textContent". Não pode ser a
      // string 'text', porque daí um data-prop-text="nome" de verdade
      // (querendo setAttribute('text', valor) num elemento que tem um
      // atributo chamado "text") seria confundido com esse caso.
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
   * Monta o Shadow DOM com só o bloco da variante ativa (quando o
   * componente tem `data-variant`) e reaplica os props já definidos —
   * necessário porque trocar de variante troca os elementos internos, então
   * os bindings antigos (e qualquer valor já aplicado) deixam de existir.
   */
  #renderTemplate() {
    this.shadowRoot.innerHTML = this.#selectVariantMarkup();
    this.#bindProps();
    this.#propBindings.forEach((_binding, name) => this.#applyProp(name));
  }

  /**
   * Sem `data-variant` no template, devolve ele inteiro (comportamento de
   * sempre). Com `data-variant`, devolve só o HTML do bloco cujos atributos
   * batem com o valor atual de **cada** eixo (`variant`, e qualquer
   * `data-variant-<eixo>` adicional) — os outros blocos nunca chegam a
   * entrar no DOM (não é esconder com CSS, é literalmente não renderizar).
   * Se a combinação pedida não existir como bloco de verdade no `.html`
   * (autor não escreveu aquele cruzamento), cai no primeiro bloco
   * encontrado — mesma filosofia de fallback de um valor de eixo inválido.
   */
  #selectVariantMarkup() {
    if (this.#variantAxes.length === 0) return this.#template;

    const activeValues = this.#variantAxes.map(({ name, values }) => {
      const requested = this.getAttribute(name);
      return { name, value: values.includes(requested) ? requested : values[0] };
    });

    const wrapper = document.createElement('template');
    wrapper.innerHTML = this.#template;
    const blocks = [...wrapper.content.querySelectorAll('[data-variant]')];

    const match = blocks.find((block) =>
      activeValues.every(({ name, value }) => {
        const attribute = name === 'variant' ? 'data-variant' : `data-variant-${name}`;
        return block.getAttribute(attribute) === value;
      }),
    );

    return (match ?? blocks[0])?.outerHTML ?? this.#template;
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
    this.#propBindings = new Map();
    this.shadowRoot.querySelectorAll('*').forEach((element) => {
      for (const attribute of element.attributes) {
        const match = PROP_DATA_ATTRIBUTE_PATTERN.exec(attribute.name);
        if (!match) continue;

        const [, toggleTarget, target] = match;
        const binding = toggleTarget
          ? { element, target: toggleTarget, isToggle: true }
          : { element, target: target ?? null, isToggle: false };
        this.#propBindings.set(attribute.value, binding);
      }
    });
  }

  /**
   * Lê os nomes de prop (`data-prop`/`data-prop-<atributo>`) presentes num
   * template — usado por cada componente pra declarar
   * `static observedAttributes`, já que esse getter é obrigatório pro
   * navegador saber quais atributos observar e chamar
   * `attributeChangedCallback`. Quando o template tem `data-variant`,
   * inclui também o nome de cada eixo de variante encontrado (`variant`, e
   * qualquer `data-variant-<eixo>` adicional) — são os atributos que
   * decidem qual bloco renderizar, então também precisam ser observados.
   */
  static extractPropNames(template) {
    const propNames = [
      ...new Set(
        [...template.matchAll(PROP_ATTRIBUTE_PATTERN)].map(
          (match) => match[1],
        ),
      ),
    ];

    BaseComponent.extractVariantAxes(template).forEach(({ name }) => {
      propNames.push(name);
    });

    return propNames;
  }

  /**
   * Lê os eixos de variante (`data-variant`/`data-variant-<eixo>`)
   * presentes num template, agrupados por eixo — `variant` pro `data-variant`
   * sem sufixo, ou o próprio sufixo pra `data-variant-<eixo>`. Pra cada
   * eixo, `values` fica na ordem em que aparece no template — o primeiro
   * valor é o padrão daquele eixo, usado quando a tag não recebe (ou
   * recebe um valor inválido em) esse atributo.
   */
  static extractVariantAxes(template) {
    const axes = new Map();

    for (const [, axisSuffix, value] of template.matchAll(
      VARIANT_ATTRIBUTE_PATTERN,
    )) {
      const axisName = axisSuffix ?? 'variant';
      if (!axes.has(axisName)) axes.set(axisName, []);

      const values = axes.get(axisName);
      if (!values.includes(value)) values.push(value);
    }

    return [...axes.entries()].map(([name, values]) => ({ name, values }));
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
