"use client";

import { useState } from "react";
import { useBinanceSocket } from "@/hooks/useBinanceSocket";
import { OrderBook } from "@/components/OrderBook";
import { RecentTrades } from "@/components/RecentTrades";
import { DepthChart } from "@/components/DepthChart";

export default function Home() {
  const [symbol, setSymbol] = useState("btcusdt");
  const { bids, asks, maxBidTotal, maxAskTotal, bestBid, bestAsk, spread, trades, connected, error, synced } = useBinanceSocket(symbol);

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-neutral-950 text-white">
      <main className="flex w-full max-w-6xl flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Real-Time Order Book</h1>
            <span className={`text-xs px-2 py-0.5 rounded ${connected ? "bg-green-900/40 text-green-300" : "bg-red-900/40 text-red-300"}`}>{connected ? "Live" : "Disconnected"}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${synced ? "bg-blue-900/40 text-blue-300" : "bg-yellow-900/40 text-yellow-300"}`}>{synced ? "Synced" : "Syncing"}</span>
            {error ? <span className="text-xs text-red-400">{error}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-300">Symbol</label>
            <select
              className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              <option value="btcusdt">BTC/USDT</option>
              <option value="ethusdt">ETH/USDT</option>
              <option value="bnbusdt">BNB/USDT</option>
              <option value="solusdt">SOL/USDT</option>
            </select>
          </div>
        </div>

        <DepthChart bids={bids} asks={asks} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[60vh]">
          <div className="md:col-span-2 min-h-0">
            <OrderBook bids={bids} asks={asks} maxBidTotal={maxBidTotal} maxAskTotal={maxAskTotal} />
          </div>
          <div className="min-h-0">
            <RecentTrades trades={trades} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-neutral-300">
          <div>
            Best Bid: <span className="text-green-400">{bestBid ? bestBid.toLocaleString() : "-"}</span>
          </div>
          <div>
            Best Ask: <span className="text-red-400">{bestAsk ? bestAsk.toLocaleString() : "-"}</span>
          </div>
          <div>
            Spread: <span className="text-yellow-300">{spread != null ? spread.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }) : "-"}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
