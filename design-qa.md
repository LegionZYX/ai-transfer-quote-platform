# Design QA

## Scope

Two selected Product Design ImageGen concepts were implemented as switchable home page versions:

- Premium AI Broker: black and gold enterprise brokerage landing page.
- Model Market Dashboard: blue and lime operational quote marketplace dashboard.

Shared quote finder and admin configuration flows remain unchanged.

## Reference Comparison

### Premium AI Broker

- Preserved dark premium surface, warm gold accents, large trust-oriented hero, right-side quote process card, resource service rows, and service assurance band.
- Adapted the globe/data background into a restrained dark premium surface so the page remains lightweight and responsive.
- Public CTA and Telegram CTA remain prominent.

### Model Market Dashboard

- Preserved dark navy SaaS dashboard feeling, bright blue/lime accents, resource market table, right-side quick quote builder, status badges, and price-visibility indicators.
- Adapted the 3D AI visual into a lightweight quote orbit panel so the UI stays deployable without extra binary assets.
- Public quote action remains usable from the market rows and hero.

## Functional Checks

- Version switch works between both designs.
- Premium version renders five resource rows.
- Market version renders market rows and quick quote builder.
- Clicking a business category on either home design now switches the in-page business detail instead of leaving the page.
- Clicking a specific product selects it in the current business context.
- Clicking consultation / inquiry actions opens Quote Finder with the selected category and product preselected.
- Admin configuration is gated by an administrator login.
- Wrong administrator credentials are rejected, correct credentials open the admin console, and logout returns to the login screen.
- Desktop width has no horizontal overflow.
- Mobile width has no horizontal overflow for both designs.
- Existing quote and admin logic were not removed.

## Final Result

passed
