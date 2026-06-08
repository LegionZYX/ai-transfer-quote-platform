# AI Resource Quote Platform Spec v1

## Goal

Build a public AI resource showcase and quote-preparation website for AI Transfer. The site helps customers understand available resources, prepare a structured quote request, see an allowed reference price range, and send the prepared demand summary through Telegram.

The first version is an MVP: frontend-only, deployable to Vercel, with admin-managed price configuration stored in the browser. A later version can replace local storage with a database and Telegram Bot push.

## Product Categories

The public catalog uses five main categories:

| Category | Products | Public Positioning |
| --- | --- | --- |
| 号池类 | Claude, OpenAI, Gemini | API consumption, tool usage, batch usage, developer workflows |
| 企业类 | AWS Bedrock, 官方账号 Key, 官方中转, 速刷线路 | Enterprise access, official resources, stable calling, custom settlement |
| 视频类 | Seedance2 满血, Seedance2 海外满血, Seedance2 残血线路 | Video generation, overseas permission needs, batch content production |
| 国内模型 | GLM, Kimi, MiniMax, Qwen, Mimo | Chinese scenarios, domestic model access, lower-cost token usage |
| 账号服务 | Claude Code, Codex, KYC | Developer accounts, AI coding accounts, identity or platform verification |

## Public Site

### Home

The home page must communicate the offer quickly:

- AI Transfer as the brand.
- Main headline: enterprise AI resource supply and quote matching.
- Two primary actions: `寻找报价` and `Telegram 咨询`.
- Five category cards with short descriptions and product names.
- A short trust/usage section: stable supply, batch calling, real-time quotes, enterprise delivery.
- A price disclaimer: reference prices depend on availability, usage, signing requirements, and permissions.

### Quote Finder

The quote finder must guide the customer through:

1. Select category.
2. Select product.
3. Enter demand details:
   - Expected usage.
   - Use case.
   - Company signing requirement.
   - Official account requirement.
   - Overseas permission requirement.
   - Additional notes.
4. Show a generated reference plan:
   - Selected category and product.
   - Reference price, or `需咨询确认` when hidden.
   - Suitable scenario.
   - Requirement notes and restrictions.
5. Generate a Telegram-ready message that the customer can copy or send through a Telegram share link.

### Contact Success State

After the customer generates or sends a demand summary, the interface should make the next step clear:

- The summary is ready.
- Final quote is confirmed through Telegram.
- Actual price can vary based on resource state and usage.

## Admin Configuration

The MVP admin area is protected by a lightweight administrator login. This is a frontend MVP gate, not a replacement for production server-side authentication. Credentials can be provided through Vercel environment variables:

- `VITE_ADMIN_USER`
- `VITE_ADMIN_PASSWORD`

If no variables are provided, the local MVP fallback is `admin / aitransfer2026`.

After login, the admin area is a local admin control surface for price structure, visibility, and daily update workflows.

Each product has these fields:

- `category`
- `name`
- `isListed`
- `showPrice`
- `publicPrice`
- `internalCost`
- `priceType`: discount, token, per-use, premium, custom
- `minimumRequirement`
- `contractRequirement`
- `permissionRequirement`
- `customerDescription`
- `adminNote`
- `updatedAt`

Rules:

- If `isListed` is false, the product does not appear in public product selectors.
- If `showPrice` is true, `publicPrice` appears in the quote plan.
- If `showPrice` is false, the quote plan shows `需咨询确认`.
- `internalCost` and `adminNote` never appear in the public quote plan.

## AI Agent Daily Price Update Flow

The project should support AI-assisted daily changes by keeping price data structured.

Expected workflow:

1. Owner sends new quote changes to Codex.
2. Codex reads the current product configuration.
3. Codex creates a change list.
4. Owner confirms.
5. Codex updates the config.
6. Codex runs build and UI verification.
7. Codex reports what changed and whether public visibility changed.

Every admin save should append an update record:

- timestamp
- product
- field changed
- previous value
- next value
- whether it affects public display
- actor

## MVP Scope

Included:

- Home page.
- Quote finder.
- Admin price configuration.
- Price visibility toggles.
- Update history.
- Telegram copy/share flow.
- Vercel deployment.

Excluded from v1:

- Online payment.
- Customer login.
- Production database.
- Multi-admin permission system.
- Telegram Bot token integration.
- Order management.

## Verification Requirements

Before deployment, verify:

- Build succeeds.
- Admin page requires login before price configuration is shown.
- Wrong admin credentials are rejected.
- Correct admin credentials open the configuration page.
- Admin logout returns to the login page.
- Category/product selectors work.
- Hidden-price products show `需咨询确认`.
- Visible-price products show configured public price.
- Internal cost does not appear in customer quote output.
- Admin edits persist in local storage.
- Update records are created.
- Telegram message text includes selected demand fields.
- Desktop and mobile layouts are usable.
