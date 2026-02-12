describe("Stock Insights Analyzer SPA", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("loads dashboard and has primary landmarks", () => {
    cy.findByRole("main").should("exist");
    cy.findByRole("navigation", { name: /primary/i }).should("exist");
    cy.findByRole("heading", { name: /stock insights analyzer/i }).should("exist");
  });

  it("supports navigation via sidebar links", () => {
    cy.findByRole("link", { name: /charts/i }).click();
    cy.findByRole("heading", { name: /charts/i }).should("exist");

    cy.findByRole("link", { name: /search/i }).click();
    cy.findByRole("heading", { name: /search & filter/i }).should("exist");

    cy.findByRole("link", { name: /trend analysis/i }).click();
    cy.findByRole("heading", { name: /trend analysis/i }).should("exist");

    cy.findByRole("link", { name: /portfolio/i }).click();
    cy.findByRole("heading", { name: /portfolio/i }).should("exist");

    cy.findByRole("link", { name: /news/i }).click();
    cy.findByRole("heading", { name: /news/i }).should("exist");

    cy.findByRole("link", { name: /settings/i }).click();
    cy.findByRole("heading", { name: /settings/i }).should("exist");

    cy.findByRole("link", { name: /help/i }).click();
    cy.findByRole("heading", { name: /help & documentation/i }).should("exist");
  });

  it("search autocomplete selects a stock and updates chart title", () => {
    cy.findByRole("link", { name: /search/i }).click();

    cy.findByLabelText(/search stocks/i).type("App");
    cy.findByRole("listbox", { name: /stock suggestions/i }).should("exist");
    cy.findByRole("option", { name: /AAPL/i }).click();

    cy.findByRole("link", { name: /charts/i }).click();
    cy.findByTestId("selected-stock").should("contain.text", "AAPL");
  });

  it("filters by sector and shows active filter chips", () => {
    cy.findByRole("link", { name: /search/i }).click();

    cy.findByLabelText(/sector filter/i).select("Technology");
    cy.findByTestId("active-filters").within(() => {
      cy.contains(/technology/i).should("exist");
    });

    cy.findByTestId("results-count").invoke("text").should("match", /\d+\s+results/i);

    cy.findByRole("button", { name: /clear filters/i }).click();
    cy.findByTestId("active-filters").within(() => {
      cy.contains(/technology/i).should("not.exist");
    });
  });

  it("theme toggle in settings updates the document theme attribute", () => {
    cy.findByRole("link", { name: /settings/i }).click();

    cy.findByRole("switch", { name: /dark mode/i }).as("themeSwitch");
    cy.get("html").should("have.attr", "data-theme");
    cy.get("@themeSwitch").click();
    cy.get("html").should("have.attr", "data-theme", "dark");
  });

  it("portfolio: create portfolio, simulate invalid sell shows error, then buy works", () => {
    cy.findByRole("link", { name: /portfolio/i }).click();

    cy.findByRole("button", { name: /new portfolio/i }).click();
    cy.findByLabelText(/portfolio name/i).type("Test Portfolio");
    cy.findByRole("button", { name: /create/i }).click();
    cy.findByRole("heading", { name: /test portfolio/i }).should("exist");

    // Add a holding
    cy.findByLabelText(/add stock to portfolio/i).type("MSFT");
    cy.findByRole("button", { name: /add/i }).click();
    cy.findByRole("row", { name: /MSFT/i }).should("exist");

    // Attempt invalid sell
    cy.findByRole("button", { name: /sell/i }).click();
    cy.findByLabelText(/shares/i).clear().type("9999");
    cy.findByRole("button", { name: /confirm sell/i }).click();
    cy.findByRole("alert").should("contain.text", "Cannot sell");

    // Buy valid
    cy.findByRole("button", { name: /buy/i }).click();
    cy.findByLabelText(/shares/i).clear().type("1");
    cy.findByRole("button", { name: /confirm buy/i }).click();
    cy.findByRole("status").should("contain.text", "Trade executed");
  });

  it("trend analysis: create a trendline and delete it", () => {
    cy.findByRole("link", { name: /trend analysis/i }).click();

    cy.findByRole("button", { name: /add trendline/i }).click();
    cy.findByTestId("trendline-list").within(() => {
      cy.findAllByRole("listitem").should("have.length.at.least", 1);
    });

    cy.findByRole("button", { name: /delete selected trendline/i }).click();
    cy.findByRole("dialog", { name: /confirm delete/i }).within(() => {
      cy.findByRole("button", { name: /delete/i }).click();
    });
    cy.findByTestId("trendline-list").within(() => {
      cy.findAllByRole("listitem").should("have.length", 0);
    });
  });
});

// Lightweight "findBy*" helpers without adding a dependency.
// Cypress Testing Library is great, but we avoid extra deps here.
Cypress.Commands.add("findByRole", (role, options = {}) => {
  const { name } = options;
  if (!name) return cy.get(`[role="${role}"]`);
  const rx = name instanceof RegExp ? name : new RegExp(String(name), "i");
  return cy.get(`[role="${role}"]`).filter((_, el) => rx.test(el.textContent || ""));
});
Cypress.Commands.add("findAllByRole", (role) => cy.get(`[role="${role}"]`));
Cypress.Commands.add("findByLabelText", (label) => {
  const rx = label instanceof RegExp ? label : new RegExp(String(label), "i");
  return cy.contains("label", rx).then(($label) => {
    const forId = $label.attr("for");
    if (forId) return cy.get(`#${forId}`);
    return cy.wrap($label).find("input,select,textarea").first();
  });
});
Cypress.Commands.add("findByTestId", (testId) => cy.get(`[data-testid="${testId}"]`));
