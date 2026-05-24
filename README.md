# Dividend Portfolio

AI-enhanced dividend investing platform built with Rails 8 and React. Track your portfolio, set target prices on your radar, plan purchases, and get intelligent insights — all in one place.

[![Build Status](https://github.com/fleveque/dividend-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/fleveque/dividend-portfolio/actions)

## Services Architecture

```
                         Internet
                            |
              +-------------+-------------+
              |             |             |
        quantic.es    pulse.quantic.es  logos.quantic.es
              |             |             |
    +---------+--+  +-------+------+  +---+--------+
    |  Rails App |  |    Pulse     |  | Logo       |
    |   (this)   |  |   Phoenix    |  | Service    |
    |            |  |   LiveView   |  | (Go)       |
    | - Auth     |  |              |  +------------+
    | - Radar    |  | - Public     |
    | - Holdings |  |   portfolios |
    | - Buy Plan |  | - Community  |
    | - AI       |  |   dashboard  |
    +-----+------+  +------+-------+
          |                |
          +---+  +---------+
              |  |
          +---+--+---+
          |   NATS   |
          | JetStream|
          +----------+
```

**Rails App** (`quantic.es`) — this app. User auth, stock radar with target prices, portfolio management with holdings, buy plan mode, dividend calendar, and AI-powered insights via Google Gemini. Publishes events to NATS when portfolio data changes.

**Pulse** (`pulse.quantic.es`) — Elixir/Phoenix app. Consumes NATS events and serves public portfolio pages and a real-time community dashboard. No database — state is held in-memory via GenServers and ETS. See [pulse repo](https://github.com/fleveque/pulse).

**NATS** — lightweight messaging server (~10MB RAM). Runs as a Docker container on the same VPS. JetStream enabled for persistent event streams. Environment isolation via subject prefixes (`prod.`, `beta.`, `dev.`).

**Logo Service** (`logos.quantic.es`) — Go microservice for company logo images. See [logo-service repo](https://github.com/fleveque/logo-service).

### NATS Event Flow

```
Rails publishes on holding changes:
  {env}.portfolio.updated     {version: 2, slug, base_currency,
                               holdings: [{symbol, currency, quantity, avg_price,
                                           price, value_in_base, value_in_usd}, ...]}

Pulse consumes -> updates GenServer state -> pushes to LiveView via PubSub
```

`value_in_base` is each holding's value pre-converted into the user's preferred
currency (via `FxRateService`); `value_in_usd` is the cross-portfolio
normalisation key the community dashboard sums on. The legacy `symbol/quantity/
avg_price/price` fields are kept so an older Pulse deploy can still compute totals
during the rollover.

## Features

- **Stock Radar**: Track stocks with target prices, financial metrics (P/E, EPS, yield, payout ratio), and price status indicators. Card and compact list views.
- **Portfolio Management**: Manage holdings with quantity, average price, real-time gain/loss tracking, and weighted average price merging. Import directly from buy plan cart.
- **Dividend Import & Tracking** *(Beta)*: Import dividend payments from broker CSVs (IBKR Activity Statement, Spanish + English) or add them manually. Per-currency totals, smoothed historical line per currency, and a 12-month projection built from your current holdings × known payment schedules. Re-import is idempotent and never overwrites manual entries.
- **Dividend Calendar**: Visualize dividend payment schedules across all your stocks. Spot income gaps by month.
- **Buy Plan Mode**: Plan purchases with a shopping cart — set quantities, see estimated costs, and move to portfolio when ready.
- **AI-Powered Insights**: Google Gemini analysis for both radar and portfolio — buying opportunities, dividend coverage gaps, risk flags, and per-stock summaries.
- **User Authentication**: Rails 8 built-in authentication + Google OAuth.
- **Multiple Financial Data Providers**: Pluggable provider pattern supporting Yahoo Finance ([yahoo_finance_client](https://github.com/fleveque/yahoo_finance_client)) and Alpha Vantage.
- **Stock Logos**: Company logos served by a self-hosted [logo-service](https://github.com/fleveque/logo-service), with fallback to colored initials.
- **Pulse Integration**: Opt-in to share your portfolio publicly via [Pulse](https://github.com/fleveque/pulse). Set a portfolio slug in settings; holdings sync in real-time via NATS.
- **Admin Dashboard**: Protected admin area with app stats (users, stocks, radars, portfolios, Pulse adoption), user management, and manual stock refresh.
- **Mobile Responsive**: Full functionality on any device with hamburger menu navigation.
- **Multi-Currency Support**: Each stock keeps its listing currency (USD, EUR, GBP, JPY, …); portfolio totals split per currency and convert to your chosen display currency via FX rates fetched from Yahoo. London-pence (`GBp`) and similar minor-unit quotes are normalised at ingest.

## Admin

### Granting Admin Role

**Local development:**
```sh
bin/rails "admin:grant[user@example.com]"
bin/rails "admin:revoke[user@example.com]"
```

The default seed user (`default@example.com`) is automatically granted admin.

**Production (Kamal):**
```sh
bin/kamal app exec "bin/rails admin:grant[your@email.com]"
```

### Admin Features

- **Dashboard stats**: Users, stocks, radars, buy plans, portfolios, holdings, and Pulse adoption
- **User management**: View all users with metadata (holdings count, Pulse slug), delete users
- **Stock refresh**: Manually trigger a stock data refresh job

## Installation

### 1. Clone the repository:

```sh
git clone https://github.com/yourusername/dividend-portfolio.git
cd dividend-portfolio
```

### 2. Configure a financial data provider:

The application supports multiple financial data providers. Currently, you can use either Alpha Vantage or Yahoo Finance.

1. **Using Alpha Vantage (Recommended)**

    1. Get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
    2. Create a `.env` file in the project root:
    ```sh
    echo "ALPHAVANTAGE_API_KEY=your_api_key_here" > .env
    ```
    3. Configure the provider in `config/initializers/financial_data_provider.rb`:
    ```
    config.financial_data_provider = :alpha_vantage
    ```

2. **Using Yahoo Finance**

    Configure the provider in `config/initializers/financial_data_provider.rb`

    ```
    config.financial_data_provider = :yahoo_finance
    ```

    Note: The Yahoo Finance API might be unstable or have limitations. Alpha Vantage is recommended for more reliable data.


### 3. Configure stock logos (optional):

The application uses a self-hosted [logo-service](https://github.com/fleveque/logo-service) to display company logos. Add these to your `.env` file:

```sh
VITE_LOGO_SERVICE_URL=https://logos.quantic.es
VITE_LOGO_SERVICE_API_KEY=your_logo_service_api_key
```

Without these, the app shows colored initials as fallback — no functionality is lost.

### 4. Configure Pulse sharing link (optional):

[Pulse](https://pulse.quantic.es) is the sibling community app where users can share their portfolios. The base URL is baked in at build time, defaulting to production — only set this if you're pointing a beta build at a different Pulse host:

```sh
VITE_PULSE_URL=https://beta-pulse.quantic.es
```

### 5. Configure AI insights (optional):

Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey) and add it to your `.env`:

```sh
GEMINI_API_KEY=your_gemini_api_key
```

Without this key, the app works normally but AI insight features will be unavailable.

#### Switching AI providers

The AI layer is provider-agnostic. Gemini is the only implementation today,
but adding another (Anthropic, OpenAI, etc.) is a 1-day task:

1. Add `app/services/ai_providers/<name>_provider.rb` inheriting from
   `AiProviders::BaseProvider` and implementing `name`, `radar_insights`,
   `portfolio_insights`, `stock_summary`, `social_post`, and `chat`.
2. Set the provider via the `AI_PROVIDER` env var (e.g. `AI_PROVIDER=anthropic`).
   Default is `gemini`.

All AI-using code paths go through `AiProviders.current` — never instantiate
a specific provider class directly.

#### AI usage limits

Non-admin users are capped at **3 AI requests per day** (UTC). Cache hits don't
count — only actual LLM calls consume quota. The limit applies across every
AI surface (radar insights, portfolio insights, stock summaries) and is logged
per user / feature / provider on the `ai_requests` table for cost attribution.
Admins bypass the limit. To change the cap, edit
`AiRateLimiter::DAILY_LIMIT`.

#### Telegram bot (optional)

Quantic ships with a Telegram bot users can link from their Settings page to
ask natural-language questions about their radar, portfolio, and dividends
(e.g. *"what dividends did I get this month?"*, *"any ex-divs this week?"*).
Each reply uses the configured AI provider and counts toward the user's
daily AI quota.

One-time operator setup:

1. Open Telegram, message `@BotFather`, run `/newbot`, pick a name and handle
   (e.g. `QuanticAppBot`). BotFather returns a token.
2. Optional polish: `/setdescription`, `/setabouttext`, `/setuserpic`.
3. Add env vars to your environment (Bitwarden for prod):
   ```sh
   TELEGRAM_BOT_TOKEN=...        # from @BotFather
   TELEGRAM_BOT_HANDLE=QuanticAppBot   # without the @
   TELEGRAM_WEBHOOK_SECRET=...   # random hex; we verify this header on each webhook
   ```
4. Register the webhook with Telegram (one-time per environment):
   ```sh
   TELEGRAM_WEBHOOK_URL=https://your.host/api/v1/telegram/webhook \
     bundle exec rails telegram:set_webhook
   ```
   Other rake tasks: `telegram:webhook_info`, `telegram:delete_webhook`.

For users: once env vars are set, the "Connect Telegram" card appears in
Settings. Clicking it issues a one-time deep link
(`https://t.me/<handle>?start=<code>`), the user taps Send in Telegram, and
the bot replies confirming the link.

For local dev: use `ngrok http 3000` to expose the webhook publicly while
testing, then set `TELEGRAM_WEBHOOK_URL` to the ngrok URL + `/api/v1/telegram/webhook`.

### 6. Install dependencies:

    ```
    bundle install
    ```

### 7. Set up the database:

    ```sh
    rails db:create
    rails db:migrate
    rails db:seed
    ```

### 8. Start the Rails server:
    ```sh
    bin/dev
    ```
You will need foreman gem if it's not installed.

### 9. Visit the application:

Open your web browser and go to http://localhost:3000.

You can sign in with the default user `default@example` and `password` as password.

## Development

### Testing

The application uses RSpec for testing. To run the tests:

```sh
bundle exec rspec
```

#### Environment Variables

For local development and testing, create a `.env.test` file:

```sh
ALPHAVANTAGE_API_KEY=dummy_key_for_tests
GEMINI_API_KEY=dummy_key_for_tests
```

For GitHub Actions, add the following to your repository secrets:

1. Go to your repository settings
2. Navigate to Secrets and Variables > Actions
3. Add a new repository secret:
   - Name: `ALPHAVANTAGE_API_KEY`
   - Value: Your Alpha Vantage API key or a dummy key for tests

Note: Tests are configured to mock API calls, so you don't need a real API key for running tests.

## Deployment

The application is deployed with [Kamal](https://kamal-deploy.org/) to a single server running Docker.

### Environments

| Environment | Branch | Domain | Auto-deploy |
|---|---|---|---|
| Production | `main` | `quantic.es`, `quantic.cat` | Yes, after CI passes |
| Beta | `beta` | `beta.quantic.es` | Yes, after CI passes |

### How it works

1. A PR is merged to `main` or `beta`
2. CI runs (tests, linting, security scans)
3. If CI passes, the deploy workflow builds a Docker image, pushes it to GHCR, and deploys via Kamal

### Forking this repo

If you fork this project, update these files with your own server, domains, and registry:

- `config/deploy.yml` — production server IP, domains, and container registry
- `config/deploy.beta.yml` — beta domain
- `.kamal/secrets` and `.kamal/secrets.beta` — fetch secrets from Bitwarden (no raw values)

Deploy secrets live in two Secure Note items in a personal
[Bitwarden](https://bitwarden.com/) vault (`quantic-prod` and `quantic-beta`,
each holding the relevant keys as custom fields), pulled at deploy time
by `.kamal/secrets` via `kamal secrets fetch --adapter bitwarden`. The
GitHub Actions secrets you need:

| Secret | Description |
|---|---|
| `SSH_PRIVATE_KEY` | SSH key authorized on your server |
| `BW_ACCOUNT` | Your Bitwarden login email (kept out of git) |
| `BW_CLIENTID` | Bitwarden personal API key — client_id (Account Settings → Security → Keys) |
| `BW_CLIENTSECRET` | Bitwarden personal API key — client_secret |
| `BW_PASSWORD` | Bitwarden master password — used to unlock the vault non-interactively in CI |

The deploy workflow installs the `bw` CLI via `npm install -g @bitwarden/cli`,
configures the EU server, runs `bw login --apikey`, then
`bw unlock --raw --passwordenv BW_PASSWORD` and exports the resulting
`BW_SESSION` to `$GITHUB_ENV`. Kamal sees status=unlocked and skips its
own login attempt — it just inherits the session and runs `bw get item ...`
against the vault.

#### Switching back to 1Password

The current Bitwarden setup replaced an earlier 1Password integration.
The 1P version is preserved verbatim at `.kamal/secrets.1password.example`
(and `.kamal/secrets.beta.1password.example`). To roll back:

```sh
cp .kamal/secrets.1password.example .kamal/secrets
cp .kamal/secrets.beta.1password.example .kamal/secrets.beta
```

Then revert the BW-related changes in `.github/workflows/deploy.yml`
(swap the "Install Bitwarden CLI" step for `1password/install-cli-action@v3`,
and the `BW_*` env vars for `OP_SERVICE_ACCOUNT_TOKEN` / `OP_ACCOUNT` / `OP_VAULT`).

#### Local development

Copy the sample files and fill in your values (both are gitignored; `direnv` loads `.env`):

```
cp env.sample .env       # fill in BW_CLIENTID + BW_CLIENTSECRET + BW_PASSWORD + dev config
cp envrc.sample .envrc
direnv allow
```
