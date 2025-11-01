[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/qj3BO8Gh)
# Frontend Engineering Assignment: Real-Time Order Book Visualizer

Please submit the Google Form once the assignment is completed.

[Submit Here](https://docs.google.com/forms/d/e/1FAIpQLSd15DGAPqTj8cThebb6Biz19ckc8aHD4o5vkhRfP-lO0WE4Kw/viewform)


**1. Objective**

The goal of this assignment is to build a high-performance, real-time stock order book visualizer using NextJS.

This assignment is designed to test your ability to manage complex, high-frequency state, handle real-world API data, and maintain a responsive, non-blocking UI—all critical skills in financial technology.

**Key Constraint:** This is a **live-API challenge**. You must connect to the **live Binance WebSocket API** to stream real-time market data. You will be expected to research the correct API methods to accomplish this.

**2. Suggested Stack**

* **Framework:** NextJS
* **Language:** TypeScript
* **State Management:** You may use React Context, `useReducer`, or a small library like Zustand.
* **Styling:** Your choice (Tailwind CSS, CSS Modules, styled-components, etc.). A clean, professional UI is expected.

**3. Core Requirements**

The project is broken down into three main parts.

---

### Part 1: The WebSocket Data Feed (Binance API)

Your first task is to research and connect to the live Binance API to stream the necessary data.

**1.1. Connect to the WebSocket API:**
* You must find and connect to the **Binance WebSocket API**.
* You will need to research their documentation to subscribe to the two types of data streams required for a trading pair (e.g., BTC/USDT):
    1.  **Aggregate Trades** (to see recent completed trades)
    2.  **Order Book Deltas** (to see live changes to the order book)
* **Recommendation:** Create a custom hook (e.g., `useBinanceSocket`) that initializes the WebSocket connection, handles incoming messages, parses the JSON, and provides the latest data to your components.
* This hook should also gracefully handle connection errors and attempt to reconnect.

**1.2. Handle API Data:**
* You must parse the data structures provided by the Binance API.
* **Trade Events:** You will need to extract the price, amount, time, and direction of each completed trade.
* **Order Book Delta Events:** You will receive frequent updates (deltas) for both bids and asks. You must process these updates correctly.
* **Important:** An update with an **amount of '0'** means this price level should be removed from the order book.

---

### Part 2: The Order Book Component

This is the main component. It must subscribe to your data feed and display the live state of the order book.

**2.1. Layout:**
* Create a two-column layout: **Bids** (buy orders) on the left and **Asks** (sell orders) on the right.

**2.2. State Management:**
* Your component must listen to the **order book delta** events from your WebSocket hook.
* You must aggregate these deltas in your component's state to maintain the full, current picture of the order book. (Hint: A `Map` or a simple object where keys are prices is ideal for $O(1)$ updates).

**2.3. Display & Sorting:**
* **Bids (Buys):**
    * Must be sorted by price in **DESCENDING** order (highest bid at the top).
    * Typically colored green.
* **Asks (Sells):**
    * Must be sorted by price in **ASCENDING** order (lowest ask at the top).
    * Typically colored red.

**2.4. Columns:**
* Each side (Bids and Asks) must display three columns for each row:
    * **Price:** The price level (e.g., "70150.50").
    * **Amount:** The total amount available at that price level.
    * **Total:** The cumulative total of all amounts from the most competitive price (top of the list) down to that row.

**2.5. The Spread:**
* Between the Bid and Ask lists, clearly display the **Spread**.
* **Spread = (Lowest Ask Price) - (Highest Bid Price).**

**2.6. Depth Visualization:**
* Each row in the order book should have a background bar (green for bids, red for asks).
* The width of this bar should represent that row's **Total (cumulative)** relative to the largest **Total** in its respective list (Bid or Ask). This creates a "depth chart" effect.
    

---

### Part 3: The Recent Trades Component

This component shows a log of the most recent market activity.

**3.1. Layout:**
* Create a separate list component that displays the **50 most recent trades**.

**3.2. Data Handling:**
* Subscribe to the **trade** events from your WebSocket hook.
* When a new trade arrives, it must be added to the top of the list.

**3.3. Highlighting:**
* When a new trade appears at the top of the list, its price should flash a color to indicate the trade's direction:
    * **Green** if it was a **market buy**.
    * **Red** if it was a **market sell**.
    * (You will need to determine how to find this information from the API's trade data).

---

### 4. Evaluation Criteria

You will be evaluated on the following:

* **Correctness:** Does the order book correctly aggregate deltas? Are sorting, cumulative totals, and the spread calculated properly?
* **Performance:** This is key. The UI must remain fluid and responsive (no lag or jank) even with high-frequency live data. We will be looking for:
    * Efficient state updates (e.g., not re-computing the entire book on every delta).
    * Proper use of React memoization (`useMemo`, `useCallback`, `React.memo`).
    * Minimal and batched re-renders.
* **API Integration:** Did you successfully research and implement the correct WebSocket feeds? How robust is the connection?
* **Code Quality:** Is the code clean, modular, and easy to read? Is state management logical and contained? Is TypeScript used effectively?
* **UI/UX:** Is the interface clean, professional, and does it present the financial data clearly?

**5. Submission Guidelines**
* Include a `README.md` file with:
    * Clear instructions on how to install dependencies (`npm install`) and run the project (`npm start`).
    * A brief explanation of any design choices or trade-offs you made (e.g., "I chose to use Zustand for state because...").
* **Host a live, working demo** of your application on a service like Vercel or Netlify. This is the best way for us to review your work.
