# Dividend Portfolio

Dividend Portfolio will be a multi-user web application built with Rails 8 that allows users to track their stock and ETF investments, record transactions, add dividends, and view statistics about their gains, losses, and dividends. The application also includes a radar feature where users can add stocks they are interested in and view basic stock information.

## Work in progress

This is a pet project I will be working on. 

Currently, it is in a very early stage, and many things may fail or not work at all. 

- The first iteration will focus on authentication and retrieving stock information using the [yahoo_finance_client](https://github.com/fleveque/yahoo_finance_client) gem. As Yahoo! Finance API doesn't seem to work anymore, I will probably need to create/use another gem for this purpose.
- The second iteration will likely focus on enabling each user to create their own radar.

Once the project reach an MVP, I will update the doc accordingly.

## Features

- **User Authentication**: Secure user authentication using Rails 8 built-in authentication.
- **Portfolio Management**: Track buys and sales of stocks and ETFs in your portfolio.
- **Dividend Tracking**: Add and manage dividends received from your investments.
- **Statistics**: View statistics about your gains, losses, and total dividends.
- **Stock Data**: Fetch stock data from reliable internet sources.
- **Portfolio Overview**: View your current portfolio with company logos and percentage allocation.
- **Radar**: Add stocks to your radar and view basic stock information such as payout, yield, P/E ratio, EPS, and stock price.

## Limitations

- Currently the application doesn't allow multiple currencies.

## Installation

1. **Clone the repository**:

```sh
git clone https://github.com/yourusername/dividend-portfolio.git
cd dividend-portfolio
```

2. **Install dependencies**:

```
bundle install
```

3. **Set up the database:**:

```sh
rails db:create
rails db:migrate
rails db:seed
```

4. **Start the Rails server**:
```sh
bin/dev
```

5. **Visit the application**:

    Open your web browser and go to http://localhost:3000.

    You can sign in with the default user `default@example` and `password` as password.
