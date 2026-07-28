describe('Home page', () => {
  it('renders the example card', () => {
    cy.visit('/');
    cy.get('positivus-example-card').should('exist');
    cy.get('.card__title').should('contain.text', 'Example Card');
    cy.get('.card__text').should('contain.text', 'Este é um componente de exemplo.');
  });
});
