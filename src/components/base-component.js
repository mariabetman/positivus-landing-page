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
const VARIANT_FILE_PATTERN = /variants\/([a-z-]+)\/([a-z-]+)\.html$/;

export class BaseComponent extends HTMLElement {
  #propBindings = new Map();
  #template = '';
  #structuralVariants = {};
  #styleAxes = {};
  #variantAxisNames = new Set();

  constructor({ template = '', styles = '', variantFiles = {} } = {}) {
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

      const { structuralVariants, styleAxes } =
        BaseComponent.parseVariantFiles(variantFiles);
      this.#structuralVariants = structuralVariants;
      this.#styleAxes = styleAxes;
      this.#variantAxisNames = new Set([
        ...(Object.keys(structuralVariants).length > 0 ? ['variant'] : []),
        ...Object.keys(styleAxes),
      ]);

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

  /**
   * Aplica o valor em **todos** os elementos ligados a esse nome de prop —
   * normalmente só um, mas se mais de um elemento do componente usar o
   * mesmo nome (por acidente, ou de propósito pra andarem juntos), os dois
   * entram na lista e recebem o valor juntos, em vez de um sobrescrever o
   * outro silenciosamente.
   */
  #applyProp(name) {
    const value = this.getAttribute(name);
    if (value === null) return;

    const bindings = this.#propBindings.get(name);
    if (!bindings) return;

    bindings.forEach((binding) => {
      const { element, target, isToggle } = binding;
      if (target === null) {
        // Sem sufixo (data-prop="nome") — target null é o sinal de "sem
        // atributo específico, é pra aplicar em textContent".
        element.textContent = value;
      } else if (target === 'modifier') {
        // data-prop-modifier="nome" — soma `<classe-base>--<valor>` na
        // classList (classList.add, nunca setAttribute('class', ...), que
        // apagaria as outras classes do elemento). O valor aceita mais de
        // um token separado por espaço (ex: "highlight dark"), igual um
        // atributo class normal — cada um vira um modificador próprio
        // (`card--highlight`, `card--dark`). Remove os modificadores
        // aplicados da vez anterior antes de somar os novos, senão trocar
        // de valor ficaria empilhando classe velha.
        if (binding.appliedModifierClasses) {
          element.classList.remove(...binding.appliedModifierClasses);
        }
        const modifierClasses = value
          .split(/\s+/)
          .filter(Boolean)
          .map((token) => `${binding.baseClass}--${token}`);
        element.classList.add(...modifierClasses);
        binding.appliedModifierClasses = modifierClasses;
      } else if (target === 'class') {
        // data-prop-class="nome" — soma classe(s) livres, sem prefixo/
        // convenção nenhuma (diferente de data-prop-modifier, que sempre
        // prefixa com a classe-base) — via classList.add, nunca
        // setAttribute('class', ...), que apagaria as classes já
        // existentes do elemento. Aceita mais de um token separado por
        // espaço, igual um `class` normal.
        if (binding.appliedClasses) {
          element.classList.remove(...binding.appliedClasses);
        }
        const classes = value.split(/\s+/).filter(Boolean);
        element.classList.add(...classes);
        binding.appliedClasses = classes;
      } else if (isToggle) {
        // Atributo booleano de HTML (disabled, checked, required...) é
        // "verdadeiro" só por existir — setAttribute(target, 'false') ainda
        // deixaria o atributo presente. toggleAttribute adiciona/remove de
        // verdade, interpretando o valor como "true"/"false".
        element.toggleAttribute(target, value === 'true');
      } else {
        element.setAttribute(target, value);
      }
    });
  }

  /**
   * Monta o Shadow DOM com o bloco estrutural certo (`variant`), soma as
   * classes dos eixos de estilo ativos e reaplica os props já definidos —
   * necessário porque trocar de `variant` troca os elementos internos,
   * então os bindings antigos (e qualquer valor já aplicado) deixam de
   * existir.
   */
  #renderTemplate() {
    this.shadowRoot.innerHTML = this.#selectBaseMarkup();
    this.#applyStyleAxisClasses();
    this.#bindProps();
    this.#propBindings.forEach((_bindings, name) => this.#applyProp(name));
  }

  /**
   * Sem variantes estruturais, devolve o template inteiro (comportamento de
   * sempre). Com `variants/variant/<valor>.html`, devolve aquele bloco
   * completo quando o atributo `variant` bate com um valor conhecido —
   * senão cai no template padrão (mesmo fallback de um valor inválido).
   */
  #selectBaseMarkup() {
    const requested = this.getAttribute('variant');
    if (requested && this.#structuralVariants[requested]) {
      return this.#structuralVariants[requested];
    }

    return this.#template;
  }

  /**
   * Pra cada eixo de estilo (`variants/<eixo>/<valor>.html`, eixo ≠
   * `variant`), lê o atributo correspondente e — se houver um arquivo pra
   * aquele valor — soma as classes do elemento raiz daquele arquivo na
   * `classList` do elemento raiz já renderizado. É assim que `variant` e N
   * eixos de estilo combinam livremente, sem precisar de um bloco HTML por
   * combinação: cada eixo de estilo só acrescenta classe, nunca troca
   * estrutura.
   */
  #applyStyleAxisClasses() {
    const root = this.shadowRoot.firstElementChild;
    if (!root) return;

    for (const [axisName, values] of Object.entries(this.#styleAxes)) {
      const requested = this.getAttribute(axisName);
      const fragment = requested ? values[requested] : undefined;
      if (!fragment) continue;

      const wrapper = document.createElement('template');
      wrapper.innerHTML = fragment;
      const modifierRoot = wrapper.content.firstElementChild;
      if (modifierRoot) root.classList.add(...modifierRoot.classList);
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
   * `data-prop-modifier="nome"` é a variante pra **modificador de estilo**:
   * soma `<classe-base>--<valor>` na `classList` do elemento (a classe-base
   * é sempre a primeira classe já escrita nele, convenção BEM de bloco
   * vindo primeiro). `data-prop-class="nome"` é parecido, mas sem prefixo
   * nenhum — soma a(s) classe(s) livre(s) do jeito que vier, sem exigir
   * que o elemento já tenha uma classe base. Os dois usam `classList.add`,
   * nunca `setAttribute('class', ...)` (que apagaria as classes já
   * presentes), e aceitam mais de um token separado por espaço (ex:
   * "highlight dark"), igual um atributo `class` normal.
   *
   * Cada nome de prop guarda uma **lista** de bindings, não um só — se dois
   * elementos do componente usarem o mesmo nome (por acidente, ou de
   * propósito pra andarem juntos), os dois entram na lista e recebem o
   * mesmo valor juntos (ver `#applyProp`).
   */
  #bindProps() {
    this.#propBindings = new Map();

    const addBinding = (name, binding) => {
      if (!this.#propBindings.has(name)) this.#propBindings.set(name, []);
      this.#propBindings.get(name).push(binding);
    };

    this.shadowRoot.querySelectorAll('*').forEach((element) => {
      for (const attribute of element.attributes) {
        const match = PROP_DATA_ATTRIBUTE_PATTERN.exec(attribute.name);
        if (!match) continue;

        const [, toggleTarget, target] = match;
        let binding;
        if (toggleTarget) {
          binding = { element, target: toggleTarget, isToggle: true };
        } else if (target === 'modifier') {
          const baseClass = element.classList[0];
          if (!baseClass) {
            // Sem classe base pra prefixar, a classe aplicada viraria a
            // string literal "undefined--<valor>" — falha rápido aqui, em
            // vez de deixar esse bug vazar silenciosamente pro CSS.
            throw new Error(
              `data-prop-modifier="${attribute.value}": o elemento marcado precisa ter pelo menos uma classe (nenhuma encontrada).`,
            );
          }
          binding = { element, target: 'modifier', baseClass };
        } else if (target === 'class') {
          binding = { element, target: 'class' };
        } else {
          binding = { element, target: target ?? null, isToggle: false };
        }
        addBinding(attribute.value, binding);
      }
    });
  }

  /**
   * Lê os nomes de prop (`data-prop`/`data-prop-<atributo>`) presentes no
   * template padrão e em cada bloco estrutural de `variantFiles` — usado
   * por cada componente pra declarar `static observedAttributes`, já que
   * esse getter é obrigatório pro navegador saber quais atributos observar
   * e chamar `attributeChangedCallback`. Inclui também `variant` (se houver
   * variante estrutural) e o nome de cada eixo de estilo encontrado — são
   * os atributos que decidem o que renderizar, então também precisam ser
   * observados.
   */
  static extractPropNames(template, variantFiles = {}) {
    const { structuralVariants, styleAxes } =
      BaseComponent.parseVariantFiles(variantFiles);

    const sources = [template, ...Object.values(structuralVariants)];
    const propNames = [
      ...new Set(
        sources.flatMap((source) =>
          [...source.matchAll(PROP_ATTRIBUTE_PATTERN)].map(
            (match) => match[1],
          ),
        ),
      ),
    ];

    if (Object.keys(structuralVariants).length > 0) propNames.push('variant');
    propNames.push(...Object.keys(styleAxes));

    return propNames;
  }

  /**
   * Agrupa o resultado de `import.meta.glob('./variants/**\/*.html', { eager:
   * true, query: '?raw', import: 'default' })` por eixo, a partir do
   * caminho de cada arquivo (`./variants/<eixo>/<valor>.html`). O eixo
   * `variant` é o único estrutural (bloco HTML completo, substitui o
   * template inteiro); qualquer outro eixo é de estilo (o arquivo carrega
   * só a classe modificadora a somar no elemento raiz já renderizado).
   */
  static parseVariantFiles(variantFiles) {
    const structuralVariants = {};
    const styleAxes = {};

    for (const [path, content] of Object.entries(variantFiles)) {
      const match = path.match(VARIANT_FILE_PATTERN);
      if (!match) continue;

      const [, axisName, value] = match;
      if (axisName === 'variant') {
        structuralVariants[value] = content;
      } else {
        styleAxes[axisName] ??= {};
        styleAxes[axisName][value] = content;
      }
    }

    return { structuralVariants, styleAxes };
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
