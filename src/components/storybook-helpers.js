import { BaseComponent } from './base-component.js';

/**
 * Gera `argTypes` (controle de texto) pra cada prop encontrado no template
 * do componente (mesma leitura que `static observedAttributes` já faz) —
 * assim toda prop já aparece editável no painel de Controls do Storybook,
 * sem precisar listar cada uma à mão em cada `.stories.js`. Cada eixo de
 * variante encontrado (`variant`, e qualquer `data-variant-<eixo>`
 * adicional — já incluídos em `extractPropNames`) vira um seletor com os
 * valores daquele eixo, em vez de um campo de texto livre.
 */
export function argTypesFromTemplate(template) {
  const argTypes = Object.fromEntries(
    BaseComponent.extractPropNames(template).map((name) => [
      name,
      { control: 'text' },
    ]),
  );

  BaseComponent.extractVariantAxes(template).forEach(({ name, values }) => {
    argTypes[name] = { control: 'select', options: values };
  });

  return argTypes;
}

/**
 * Cria a função `render` de uma story: monta a tag e aplica cada arg como
 * atributo — a mesma forma que quem usa o componente de verdade faria
 * (`<positivus-x nome="valor">`).
 */
export function renderWithArgs(tagName) {
  return (args) => {
    const el = document.createElement(tagName);
    Object.entries(args).forEach(([name, value]) => {
      if (value) el.setAttribute(name, value);
    });
    return el;
  };
}
