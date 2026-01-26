# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Start development server (runs Rails + Tailwind CSS watcher)
bin/dev

# Run all tests
bundle exec rspec

# Run a single test file
bundle exec rspec spec/models/radar_spec.rb

# Run a specific test by line number
bundle exec rspec spec/models/radar_spec.rb:15

# Linting
bin/rubocop

# Security scan
bin/brakeman --no-pager

# JavaScript dependency audit
bin/importmap audit

# Database setup
rails db:create db:migrate db:seed
```

## Architecture Overview

### Financial Data Provider System

The app uses a pluggable provider pattern for fetching stock data from external APIs:

- `FinancialDataService` (app/services/financial_data_service.rb) - Entry point that delegates to the configured provider
- `FinancialDataProviders::BaseProvider` - Abstract base class that handles caching (1-hour TTL) and stock persistence
- Provider implementations: `AlphaVantageProvider`, `YahooFinanceProvider`
- Provider selection: `config/initializers/financial_data_provider.rb` sets `Rails.application.config.financial_data_provider`

To add a new provider: create a class in `app/services/financial_data_providers/` that inherits from `BaseProvider` and implements `fetch_and_normalize_stock(symbol)`.

### Decorator Pattern

Decorators in `app/decorators/` use `SimpleDelegator` (not a gem). `StockDecorator` handles price formatting, target price comparison logic, and CSS classes for visual status indicators.

### Domain Model

- **User** has one **Radar** (watchlist) and many **Transactions** and **Dividends**
- **Radar** has many **Stocks** through **RadarStock** (join table with `target_price` attribute)
- **RadarStock** uses composite primary key `[:radar_id, :stock_id]`
- **Stock** stores symbol, name, and price (fetched from financial providers)

### Frontend

- Rails 8 with Hotwire (Turbo + Stimulus)
- Tailwind CSS for styling
- Importmap for JavaScript (no Node.js build step)

## Configuration

- Ruby version specified in `.ruby-version`
- Financial provider requires `ALPHAVANTAGE_API_KEY` environment variable (use `.env` for development, `.env.test` for tests)
- Tests use RSpec with FactoryBot and Shoulda Matchers
