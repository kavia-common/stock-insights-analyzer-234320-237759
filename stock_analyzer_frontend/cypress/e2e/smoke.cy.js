describe('Stock Insights Analyzer - smoke & a11y', () => {
  it('loads dashboard and has no critical a11y violations', () => {
    cy.visit('/dashboard');
    cy.contains('Stock Insights Analyzer');
    cy.checkA11yPage();
  });

  it('search page loads and filters UI is reachable', () => {
    cy.visit('/search');
    cy.findByLabelText?.('Search by symbol or company name');
    cy.checkA11yPage();
  });

  it('portfolio page loads', () => {
    cy.visit('/portfolio');
    cy.contains('Portfolios');
    cy.checkA11yPage();
  });

  it('settings page loads', () => {
    cy.visit('/settings');
    cy.contains('Preferences');
    cy.checkA11yPage();
  });

  it('help page loads', () => {
    cy.visit('/help');
    cy.contains('Help & Documentation');
    cy.checkA11yPage();
  });
});
