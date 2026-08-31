import { BaseComponent } from './base-component.js';

/**
 * Gera `argTypes` (controle de texto) pra cada prop encontrado no template
 * do componente (mesma leitura que `static observedAttributes` já faz) —
 * assim toda prop já aparece editável no painel de Controls do Storybook,
 * sem precisar listar cada uma à mão em cada `.stories.js`. Cada eixo de
 * variante encontrado em `variantFiles` (`variant`, e qualquer eixo de
 * estilo adicional — já incluídos em `extractPropNames`) vira um seletor
 * com os valores daquele eixo, em vez de um campo de texto livre.
 */
export function argTypesFromTemplate(template, variantFiles = {}) {
  const argTypes = Object.fromEntries(
    BaseComponent.extractPropNames(template, variantFiles).map((name) => [
      name,
      { control: 'text' },
    ]),
  );

  const { structuralVariants, styleAxes } =
    BaseComponent.parseVariantFiles(variantFiles);

  if (Object.keys(structuralVariants).length > 0) {
    argTypes.variant = {
      control: 'select',
      options: ['default', ...Object.keys(structuralVariants)],
    };
  }

  for (const [axisName, values] of Object.entries(styleAxes)) {
    argTypes[axisName] = {
      control: 'select',
      options: ['default', ...Object.keys(values)],
    };
  }

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
