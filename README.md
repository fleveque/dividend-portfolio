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
  {env}.portfolio.updated     {slug, holdings: [{symbol, quantity, avg_price}]}

Pulse consumes -> updates GenServer state -> pushes to LiveView via PubSub
```

## Features

- **Stock Radar**: Track stocks with target prices, financial metrics (P/E, EPS, yield, payout ratio), and price status indicators. Card and compact list views.
- **Portfolio Management**: Manage holdings with quantity, average price, real-time gain/loss tracking, and weighted average price merging. Import directly from buy plan cart.
- **Dividend Calendar**: Visualize dividend payment schedules across all your stocks. Spot income gaps by month.
- **Buy Plan Mode**: Plan purchases with a shopping cart — set quantities, see estimated costs, and move to portfolio when ready.
- **AI-Powered Insights**: Google Gemini analysis for both radar and portfolio — buying opportunities, dividend coverage gaps, risk flags, and per-stock summaries.
- **User Authentication**: Rails 8 built-in authentication + Google OAuth.
- **Multiple Financial Data Providers**: Pluggable provider pattern supporting Yahoo Finance ([yahoo_finance_client](https://github.com/fleveque/yahoo_finance_client)) and Alpha Vantage.
- **Stock Logos**: Company logos served by a self-hosted [logo-service](https://github.com/fleveque/logo-service), with fallback to colored initials.
- **Pulse Integration**: Opt-in to share your portfolio publicly via [Pulse](https://github.com/fleveque/pulse). Set a portfolio slug in settings; holdings sync in real-time via NATS.
- **Admin Dashboard**: Protected admin area with app stats (users, stocks, radars, portfolios, Pulse adoption), user management, and manual stock refresh.
- **Mobile Responsive**: Full functionality on any device with hamburger menu navigation.

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

## Limitations

- Currently the application doesn't allow multiple currencies.

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

### 4. Configure AI insights (optional):

Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey) and add it to your `.env`:

```sh
GEMINI_API_KEY=your_gemini_api_key
```

Without this key, the app works normally but AI insight features will be unavailable.

### 5. Install dependencies:

    ```
    bundle install
    ```

### 6. Set up the database:

    ```sh
    rails db:create
    rails db:migrate
    rails db:seed
    ```

### 7. Start the Rails server:
    ```sh
    bin/dev
    ```
You will need foreman gem if it's not installed.

### 8. Visit the application:

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
- `.kamal/secrets` and `.kamal/secrets.beta` — secret references (no raw values)

Then add these GitHub Actions secrets to your repository:

| Secret | Description |
|---|---|
| `SSH_PRIVATE_KEY` | SSH key authorized on your server |
| `KAMAL_REGISTRY_PASSWORD` | Container registry token (e.g. GHCR PAT with `packages:write`) |
| `RAILS_MASTER_KEY` | Contents of `config/master.key` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GEMINI_API_KEY` | Google Gemini API key (optional) |
| `VITE_LOGO_SERVICE_URL` | Logo service URL (optional) |
| `VITE_LOGO_SERVICE_API_KEY` | Logo service API key (optional) |
