import { describe, expect, it } from 'vitest';
import { BaseComponent } from './base-component.js';

const template = `
  <img class="fixture__image" src="./default.svg" alt="Imagem padrão" data-prop-src="src" data-prop-alt="alt" />
  <a class="fixture__link" href="#" data-prop-href="href">Link padrão</a>
  <p class="fixture__text" data-prop="text">Texto padrão</p>
  <button class="fixture__button" data-prop-toggle-disabled="disabled">Enviar</button>
`;

class BaseComponentFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template });
  }
}

customElements.define('base-component-fixture', BaseComponentFixture);

const nestedChildTemplate = `<img class="child__icon" src="./default.svg" data-prop-src="src" />`;

class NestedChildFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(nestedChildTemplate);

  constructor() {
    super({ template: nestedChildTemplate });
  }
}

customElements.define('nested-child-fixture', NestedChildFixture);

// Simula um componente pai passando uma imagem via atributo pra um
// componente aninhado (composição) — o valor já pronto (aqui, uma URL
// qualquer) fica disponível assim que o filho é criado/atualizado, sem
// depender de nenhuma outra etapa.
const nestedParentTemplate = `<nested-child-fixture src="https://example.com/resolved-icon.png"></nested-child-fixture>`;

class NestedParentFixture extends BaseComponent {
  constructor() {
    super({ template: nestedParentTemplate });
  }
}

customElements.define('nested-parent-fixture', NestedParentFixture);

// "Neto" — nível mais baixo, aceita `src` via apelido `src` (poderia ser
// qualquer nome, aqui coincide de propósito).
const grandchildTemplate = `<img class="grandchild__icon" src="./default.svg" data-prop-src="src" />`;

class GrandchildFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(grandchildTemplate);

  constructor() {
    super({ template: grandchildTemplate });
  }
}

customElements.define('grandchild-fixture', GrandchildFixture);

// "Pai" — contém o neto, e repassa o próprio prop `icon` pro `src` dele
// (apelido diferente em cada nível, de propósito, pra deixar claro que não
// precisa ser o mesmo nome do início ao fim da cadeia).
const parentTemplate = `<grandchild-fixture src="./default.svg" data-prop-src="icon"></grandchild-fixture>`;

class ParentFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(parentTemplate);

  constructor() {
    super({ template: parentTemplate });
  }
}

customElements.define('parent-fixture', ParentFixture);

// "Avô" — contém o pai, e repassa o próprio prop `avatar` pro `icon` dele.
// Passar `avatar` no avô chega até o `<img src>` do neto, atravessando os
// dois níveis do meio, cada um com seu próprio apelido.
const grandparentTemplate = `<parent-fixture icon="./default.svg" data-prop-icon="avatar"></parent-fixture>`;

class GrandparentFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(grandparentTemplate);

  constructor() {
    super({ template: grandparentTemplate });
  }
}

customElements.define('grandparent-fixture', GrandparentFixture);

// data-prop-modifier="nome" — soma "<classe-base>--<valor>" na classList,
// sem apagar a classe base nem outras classes já presentes.
const modifierFixtureTemplate = `<div class="modifier-fixture" data-prop-modifier="tone">Conteúdo</div>`;

class ModifierFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(modifierFixtureTemplate);

  constructor() {
    super({ template: modifierFixtureTemplate });
  }
}

customElements.define('modifier-fixture', ModifierFixture);

// Elemento marcado com data-prop-modifier mas sem nenhuma classe — sem
// classe base pra prefixar, isso precisa falhar rápido (ver #bindProps),
// em vez de deixar vazar uma classe "undefined--<valor>" pro CSS.
const modifierWithoutClassTemplate = `<div data-prop-modifier="tone">Conteúdo</div>`;

class ModifierWithoutClassFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(
    modifierWithoutClassTemplate,
  );

  constructor() {
    super({ template: modifierWithoutClassTemplate });
  }
}

customElements.define('modifier-without-class-fixture', ModifierWithoutClassFixture);

// Dois elementos com o mesmo nome de prop (href), de propósito — os dois
// são tratados como o mesmo prop e devem atualizar juntos (ver
// #applyProp/#bindProps).
const sharedPropTemplate = `
  <a class="shared-fixture__first" href="#um" data-prop-href="href">Primeiro link</a>
  <a class="shared-fixture__second" href="#dois" data-prop-href="href">Segundo link</a>
`;

class SharedPropFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(sharedPropTemplate);

  constructor() {
    super({ template: sharedPropTemplate });
  }
}

customElements.define('shared-prop-fixture', SharedPropFixture);

// Dois links com apelidos diferentes (image-href/href) pro mesmo atributo
// real (href) — com apelido, cada um vira um prop independente, diferente
// do caso acima onde os dois usam o mesmo nome de propósito.
const independentHrefsTemplate = `
  <a class="independent-fixture__image-link" href="#imagem" data-prop-href="image-href">Imagem</a>
  <a class="independent-fixture__link" href="#saiba-mais" data-prop-href="href">Saiba mais</a>
`;

class IndependentHrefsFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(independentHrefsTemplate);

  constructor() {
    super({ template: independentHrefsTemplate });
  }
}

customElements.define('independent-hrefs-fixture', IndependentHrefsFixture);

const variantFixtureTemplate = `
  <div class="variant-fixture__default">
    <p class="variant-fixture__text" data-prop="text">Texto padrão</p>
  </div>
`;

// Mesmo formato que `import.meta.glob('./variants/**/*.html', { eager:
// true, query: '?raw', import: 'default' })` produziria — não precisa de
// arquivo de verdade em disco pra testar isso. `variant` é o eixo
// estrutural (bloco completo); `tone` é um eixo de estilo (só a classe).
const variantFixtureFiles = {
  './variants/variant/compact.html': `
    <div class="variant-fixture__compact">
      <p class="variant-fixture__text" data-prop="text">Texto padrão</p>
    </div>
  `,
  './variants/tone/dark.html': `<div class="variant-fixture__dark"></div>`,
};

class VariantFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(
    variantFixtureTemplate,
    variantFixtureFiles,
  );

  constructor() {
    super({ template: variantFixtureTemplate, variantFiles: variantFixtureFiles });
  }
}

customElements.define('variant-fixture', VariantFixture);

describe('BaseComponent', () => {
  it('extractPropNames lê os nomes de data-prop, data-prop-<atributo> e data-prop-toggle-<atributo> do template, sem duplicar', () => {
    expect(BaseComponent.extractPropNames(template)).toEqual([
      'src',
      'alt',
      'href',
      'text',
      'disabled',
    ]);
  });

  it('mantém o conteúdo padrão quando nenhum atributo é passado', () => {
    const el = document.createElement('base-component-fixture');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__text').textContent).toBe(
      'Texto padrão',
    );

    el.remove();
  });

  it('aplica o atributo de texto no elemento marcado com data-prop', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('text', 'Texto customizado');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__text').textContent).toBe(
      'Texto customizado',
    );

    el.remove();
  });

  it('aplica o atributo de imagem no <img> marcado com data-prop-src', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('src', 'https://example.com/foo.png');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__image').src).toBe(
      'https://example.com/foo.png',
    );

    el.remove();
  });

  it('aplica o atributo de alt no <img> marcado com data-prop-alt', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('alt', 'Foto customizada');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__image').alt).toBe(
      'Foto customizada',
    );

    el.remove();
  });

  it('aplica o atributo de href no <a> marcado com data-prop-href', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('href', 'https://exemplo.com/pagina');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__link').href).toBe(
      'https://exemplo.com/pagina',
    );

    el.remove();
  });

  it('mantém o atributo booleano ausente por padrão', () => {
    const el = document.createElement('base-component-fixture');
    document.body.append(el);

    expect(
      el.shadowRoot.querySelector('.fixture__button').hasAttribute('disabled'),
    ).toBe(false);

    el.remove();
  });

  it('liga o atributo booleano com data-prop-toggle quando o valor é "true"', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('disabled', 'true');
    document.body.append(el);

    expect(
      el.shadowRoot.querySelector('.fixture__button').hasAttribute('disabled'),
    ).toBe(true);

    el.remove();
  });

  it('desliga o atributo booleano com data-prop-toggle quando o valor é "false" (diferente de setAttribute)', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('disabled', 'false');
    document.body.append(el);

    expect(
      el.shadowRoot.querySelector('.fixture__button').hasAttribute('disabled'),
    ).toBe(false);

    el.remove();
  });

  it('resolve corretamente uma imagem já pronta no atributo de um componente aninhado', () => {
    const el = document.createElement('nested-parent-fixture');
    document.body.append(el);

    const child = el.shadowRoot.querySelector('nested-child-fixture');
    expect(child.shadowRoot.querySelector('.child__icon').src).toBe(
      'https://example.com/resolved-icon.png',
    );

    el.remove();
  });

  it('repassa um prop através de três níveis (avô → pai → neto), cada um com seu próprio apelido', () => {
    const el = document.createElement('grandparent-fixture');
    el.setAttribute('avatar', 'https://exemplo.com/foto.png');
    document.body.append(el);

    const parent = el.shadowRoot.querySelector('parent-fixture');
    expect(parent.getAttribute('icon')).toBe('https://exemplo.com/foto.png');

    const grandchild = parent.shadowRoot.querySelector('grandchild-fixture');
    expect(grandchild.getAttribute('src')).toBe('https://exemplo.com/foto.png');
    expect(grandchild.shadowRoot.querySelector('.grandchild__icon').src).toBe(
      'https://exemplo.com/foto.png',
    );

    el.remove();
  });

  it('não adiciona nenhum modificador quando o prop de data-prop-modifier não é passado', () => {
    const el = document.createElement('modifier-fixture');
    document.body.append(el);

    const div = el.shadowRoot.querySelector('.modifier-fixture');
    expect(div.classList.length).toBe(1);
    expect(div.classList.contains('modifier-fixture')).toBe(true);

    el.remove();
  });

  it('data-prop-modifier soma <classe-base>--<valor> na classList, sem apagar a classe base', () => {
    const el = document.createElement('modifier-fixture');
    el.setAttribute('tone', 'highlight');
    document.body.append(el);

    const div = el.shadowRoot.querySelector('.modifier-fixture');
    expect(div.classList.contains('modifier-fixture')).toBe(true);
    expect(div.classList.contains('modifier-fixture--highlight')).toBe(true);

    el.remove();
  });

  it('troca de modificador ao mudar o valor, sem acumular o antigo', () => {
    const el = document.createElement('modifier-fixture');
    el.setAttribute('tone', 'highlight');
    document.body.append(el);

    el.setAttribute('tone', 'dark');

    const div = el.shadowRoot.querySelector('.modifier-fixture');
    expect(div.classList.contains('modifier-fixture--highlight')).toBe(false);
    expect(div.classList.contains('modifier-fixture--dark')).toBe(true);
    expect(div.classList.contains('modifier-fixture')).toBe(true);

    el.remove();
  });

  it('falha rápido se o elemento marcado com data-prop-modifier não tem nenhuma classe', () => {
    // `new` direto (em vez de document.createElement) porque o upgrade via
    // Custom Elements só "reporta" uma exceção do constructor (como um erro
    // não tratado), sem propagar pra quem chamou createElement — instanciar
    // a classe direto já lança normalmente, do jeito que dá pra capturar.
    expect(() => new ModifierWithoutClassFixture()).toThrow(
      /precisa ter pelo menos uma classe/,
    );
  });

  it('atualiza todos os elementos que compartilham o mesmo nome de atributo, em vez de um sobrescrever o outro', () => {
    const el = document.createElement('shared-prop-fixture');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.shared-fixture__first').getAttribute('href')).toBe(
      '#um',
    );
    expect(el.shadowRoot.querySelector('.shared-fixture__second').getAttribute('href')).toBe(
      '#dois',
    );

    el.setAttribute('href', 'https://exemplo.com/pagina');

    expect(el.shadowRoot.querySelector('.shared-fixture__first').getAttribute('href')).toBe(
      'https://exemplo.com/pagina',
    );
    expect(el.shadowRoot.querySelector('.shared-fixture__second').getAttribute('href')).toBe(
      'https://exemplo.com/pagina',
    );

    el.remove();
  });

  it('com apelidos diferentes, dois atributos href viram props independentes', () => {
    const el = document.createElement('independent-hrefs-fixture');
    el.setAttribute('href', 'https://exemplo.com/saiba-mais');
    document.body.append(el);

    expect(
      el.shadowRoot.querySelector('.independent-fixture__link').getAttribute('href'),
    ).toBe('https://exemplo.com/saiba-mais');
    expect(
      el.shadowRoot.querySelector('.independent-fixture__image-link').getAttribute('href'),
    ).toBe('#imagem');

    el.setAttribute('image-href', 'https://exemplo.com/galeria');

    expect(
      el.shadowRoot.querySelector('.independent-fixture__image-link').getAttribute('href'),
    ).toBe('https://exemplo.com/galeria');
    expect(
      el.shadowRoot.querySelector('.independent-fixture__link').getAttribute('href'),
    ).toBe('https://exemplo.com/saiba-mais');

    el.remove();
  });

  it('parseVariantFiles separa o eixo estrutural (variant) dos eixos de estilo, agrupados por eixo', () => {
    expect(BaseComponent.parseVariantFiles(variantFixtureFiles)).toEqual({
      structuralVariants: {
        compact: variantFixtureFiles['./variants/variant/compact.html'],
      },
      styleAxes: {
        tone: { dark: variantFixtureFiles['./variants/tone/dark.html'] },
      },
    });
  });

  it('extractPropNames inclui o nome de cada eixo de variante quando há variantFiles', () => {
    const propNames = BaseComponent.extractPropNames(
      variantFixtureTemplate,
      variantFixtureFiles,
    );
    expect(propNames).toContain('variant');
    expect(propNames).toContain('tone');
  });

  it('renderiza só o bloco da variante padrão (a primeira) quando nenhum atributo variant é passado', () => {
    const el = document.createElement('variant-fixture');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.variant-fixture__default')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.variant-fixture__compact')).toBeNull();

    el.remove();
  });

  it('renderiza só o bloco pedido em variant, sem o outro nunca existir no DOM', () => {
    const el = document.createElement('variant-fixture');
    el.setAttribute('variant', 'compact');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.variant-fixture__compact')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.variant-fixture__default')).toBeNull();

    el.remove();
  });

  it('troca de bloco quando o atributo variant muda depois de criado', () => {
    const el = document.createElement('variant-fixture');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.variant-fixture__default')).not.toBeNull();

    el.setAttribute('variant', 'compact');

    expect(el.shadowRoot.querySelector('.variant-fixture__default')).toBeNull();
    expect(el.shadowRoot.querySelector('.variant-fixture__compact')).not.toBeNull();

    el.remove();
  });

  it('reaplica um prop compartilhado (mesmo nome nos dois blocos) depois de trocar de variante', () => {
    const el = document.createElement('variant-fixture');
    el.setAttribute('text', 'Texto customizado');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.variant-fixture__text').textContent).toBe(
      'Texto customizado',
    );

    el.setAttribute('variant', 'compact');

    expect(el.shadowRoot.querySelector('.variant-fixture__text').textContent).toBe(
      'Texto customizado',
    );

    el.remove();
  });

  it('troca só o eixo tone, mantendo variant no padrão', () => {
    const el = document.createElement('variant-fixture');
    el.setAttribute('tone', 'dark');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.variant-fixture__default')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.variant-fixture__dark')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.variant-fixture__compact')).toBeNull();

    el.remove();
  });

  it('combina os dois eixos ao mesmo tempo (variant=compact + tone=dark)', () => {
    const el = document.createElement('variant-fixture');
    el.setAttribute('variant', 'compact');
    el.setAttribute('tone', 'dark');
    document.body.append(el);

    const block = el.shadowRoot.querySelector('.variant-fixture__compact');
    expect(block).not.toBeNull();
    expect(block.classList.contains('variant-fixture__dark')).toBe(true);
    expect(el.shadowRoot.querySelector('.variant-fixture__default')).toBeNull();

    el.remove();
  });

  it('cai no padrão daquele eixo quando um valor de tone inválido é passado', () => {
    const el = document.createElement('variant-fixture');
    el.setAttribute('tone', 'nao-existe');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.variant-fixture__default')).not.toBeNull();
    expect(el.shadowRoot.querySelector('.variant-fixture__dark')).toBeNull();

    el.remove();
  });
});
