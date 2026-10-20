describe('L2Earn preview screenshots', () => {
  it('captures landing page', () => {
    cy.viewport(1440, 900);
    cy.visit('/');
    cy.wait(2500);
    cy.screenshot('landing');
  });
});
