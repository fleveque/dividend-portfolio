# Dividend Portfolio

Dividend Portfolio will be a multi-user web application built with Rails 8 that allows users to track their stock and ETF investments, record transactions, add dividends, and view statistics about their gains, losses, and dividends. The application also includes a radar feature where users can add stocks they are interested in and view basic stock information.

## Work in progress

This is a pet project I will be working on. 

Currently, it is in a very early stage, and many things may fail or not work at all. 

- The first iteration will focus on authentication and retrieving stock information using the [yahoo_finance_client](https://github.com/fleveque/yahoo_finance_client) gem. As Yahoo! Finance API doesn't seem to work anymore, the application now allows to add/configure other financial data providers. I'm adding Alpha Vantage first, as there is already an available gem.
- The second iteration will likely focus on enabling each user to create their own radar.

Once the project reach an MVP, I will update the doc accordingly.

## Features

- **User Authentication**: Secure user authentication using Rails 8 built-in authentication.
- **Multiple Financial Data Providers**: Choose the one that better fits your needs.
- **Portfolio Management**: Track buys and sales of stocks and ETFs in your portfolio.
- **Dividend Tracking**: Add and manage dividends received from your investments.
- **Statistics**: View statistics about your gains, losses, and total dividends.
- **Stock Data**: Fetch stock data from reliable internet sources.
- **Portfolio Overview**: View your current portfolio with company logos and percentage allocation.
- **Radar**: Add stocks to your radar and view basic stock information such as payout, yield, P/E ratio, EPS, and stock price.

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


### 3. Install dependencies:

    ```
    bundle install
    ```

### 4. Set up the database::

    ```sh
    rails db:create
    rails db:migrate
    rails db:seed
    ```

### 5. Start the Rails server:
    ```sh
    bin/dev
    ```
You will need foreman gem if it's not installed.

### 6. Visit the application:

Open your web browser and go to http://localhost:3000.

You can sign in with the default user `default@example` and `password` as password.
