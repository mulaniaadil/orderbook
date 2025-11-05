Real-Time Order Book Visualizer (Binance)
=========================================

A high-performance, real-time order book and recent trades visualizer for Binance spot markets, built with Next.js (App Router) and TypeScript. It connects directly to Binance WebSocket streams for aggregate trades and order book delta updates.

Tech stack
----------
- Next.js (App Router, TypeScript)
- Tailwind CSS
- Lightweight state + batching with React hooks

Getting started
---------------

Prerequisites: Node 18+ and npm.

1. Install dependencies:

```
npm install
```

2. Run the dev server:

```
npm run dev
```

Open `http://localhost:3000` in your browser.

Build for production:

```
npm run build
npm start
```

Features
--------
- Live WebSocket data from Binance for a selected symbol (default `BTC/USDT`).
- Order book:
  - Aggregates delta updates for bids and asks.
  - Correct removal of levels when quantity is 0.
  - Sorted: bids (DESC), asks (ASC).
  - Cumulative totals and visual depth bars per side.
  - Spread display between best ask and best bid.
- Recent trades:
  - Top-50 rolling list of aggregate trades.
  - Price flashes green for market buys and red for market sells.

Implementation notes
--------------------
- The WebSocket hook `useBinanceSocket` combines two Binance streams: `<symbol>@aggTrade` and `<symbol>@depth@100ms`.
- Deltas are accumulated in `Map`s to achieve O(1) updates per level; UI re-renders are throttled via `requestAnimationFrame` to keep the interface smooth under high frequency.
- Trade side is derived from the Binance aggTrade flag `m` (buyer is maker):
  - `m === false` ⇒ taker buy (market buy) ⇒ green
  - `m === true` ⇒ taker sell (market sell) ⇒ red

Design choices
--------------
- Kept dependencies minimal and used React hooks for state and memoization to reduce re-render cost.
- Batched UI updates on animation frames instead of updating on every message to avoid jank.
- Chosen Tailwind for fast, consistent styling.

Deployment
----------
Deploy easily to Vercel:

1. Push this repository to GitHub.
2. Import it in Vercel and use default settings (Next.js). 
3. After deployment, share the live URL.

Notes
-----
- For production-grade order book accuracy, you would synchronize with a snapshot from the REST API and apply depth diffs using update IDs. For this assignment, the real-time delta aggregation approach is sufficient and keeps the UI highly responsive.

Assignment brief
----------------

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/qj3BO8Gh)

Please submit the Google Form once the assignment is completed: [Submit Here](https://docs.google.com/forms/d/e/1FAIpQLSd15DGAPqTj8cThebb6Biz19ckc8aHD4o5vkhRfP-lO0WE4Kw/viewform)

1. Objective
------------

Build a high-performance, real-time stock order book visualizer using Next.js. This is a live-API challenge using the Binance WebSocket API for aggregate trades and order book deltas.

2. Suggested stack
------------------

- Framework: Next.js
- Language: TypeScript
- State: React Context, `useReducer`, or a small library like Zustand
- Styling: Tailwind CSS, CSS Modules, or styled-components

3. Core requirements
--------------------

### Part 1: WebSocket data feed (Binance API)

- Connect to Binance WebSocket API
- Subscribe to:
  - Aggregate Trades
  - Order Book Deltas
- Create a hook (e.g., `useBinanceSocket`) to initialize, parse JSON, expose latest data, handle errors, and reconnect
- Parse events and remove price levels when amount is `0`

### Part 2: Order Book component

- Two columns: Bids (left), Asks (right)
- Aggregate deltas to maintain the full book (O(1) updates)
- Sort: Bids DESC, Asks ASC
- Columns per row: Price, Amount, Total (cumulative)
- Show spread between best ask and best bid
- Depth bars with width proportional to cumulative totals

### Part 3: Recent Trades component

- Display the 50 most recent trades
- Prepend new trades at the top
- Flash price color: green for market buy, red for market sell

4. Evaluation criteria
----------------------

- Correctness (aggregation, sorting, totals, spread)
- Performance (batched updates, memoization, minimal re-renders)
- API integration robustness
- Code quality and TypeScript usage
- UI/UX clarity

5. Submission guidelines
------------------------

- Include README with install/run instructions and design notes
- Host a live demo (e.g., Vercel) and share the URL