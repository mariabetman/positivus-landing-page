import { describe, expect, it } from 'vitest';
import { BaseComponent } from './base-component.js';

const template = `
  <img class="fixture__image" src="./default.svg" alt="Imagem padrão" data-prop-src="image" data-prop-alt="image-alt" />
  <a class="fixture__link" href="#" data-prop-href="link">Link padrão</a>
  <p class="fixture__text" data-prop="text">Texto padrão</p>
  <button class="fixture__button" data-prop-toggle-disabled="is-disabled">Enviar</button>
`;

class BaseComponentFixture extends BaseComponent {
  static observedAttributes = BaseComponent.extractPropNames(template);

  constructor() {
    super({ template });
  }
}

customElements.define('base-component-fixture', BaseComponentFixture);

const nestedChildTemplate = `<img class="child__icon" src="./default.svg" data-prop-src="icon" />`;

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
const nestedParentTemplate = `<nested-child-fixture icon="https://example.com/resolved-icon.png"></nested-child-fixture>`;

class NestedParentFixture extends BaseComponent {
  constructor() {
    super({ template: nestedParentTemplate });
  }
}

customElements.define('nested-parent-fixture', NestedParentFixture);

describe('BaseComponent', () => {
  it('extractPropNames lê os nomes de data-prop, data-prop-<atributo> e data-prop-toggle-<atributo> do template, sem duplicar', () => {
    expect(BaseComponent.extractPropNames(template)).toEqual([
      'image',
      'image-alt',
      'link',
      'text',
      'is-disabled',
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
    el.setAttribute('image', 'https://example.com/foo.png');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__image').src).toBe(
      'https://example.com/foo.png',
    );

    el.remove();
  });

  it('aplica o atributo de alt no <img> marcado com data-prop-alt', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('image-alt', 'Foto customizada');
    document.body.append(el);

    expect(el.shadowRoot.querySelector('.fixture__image').alt).toBe(
      'Foto customizada',
    );

    el.remove();
  });

  it('aplica o atributo de href no <a> marcado com data-prop-href', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('link', 'https://exemplo.com/pagina');
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
    el.setAttribute('is-disabled', 'true');
    document.body.append(el);

    expect(
      el.shadowRoot.querySelector('.fixture__button').hasAttribute('disabled'),
    ).toBe(true);

    el.remove();
  });

  it('desliga o atributo booleano com data-prop-toggle quando o valor é "false" (diferente de setAttribute)', () => {
    const el = document.createElement('base-component-fixture');
    el.setAttribute('is-disabled', 'false');
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
});
