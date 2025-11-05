"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PriceLevel = [price: number, size: number];

export type Trade = {
  id: number;
  price: number;
  size: number;
  time: number;
  side: "buy" | "sell"; // buy = taker buy (market buy), sell = taker sell (market sell)
};

export type OrderBookSide = PriceLevel[];

export type UseBinanceSocketResult = {
  bids: OrderBookSide;
  asks: OrderBookSide;
  maxBidTotal: number;
  maxAskTotal: number;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  trades: Trade[];
  connected: boolean;
  error?: string;
  synced: boolean;
};

const BINANCE_WS = "wss://stream.binance.com:443/stream";

function parseNumber(v: string | number): number {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function useBinanceSocket(symbol: string = "btcusdt"): UseBinanceSocketResult {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [synced, setSynced] = useState(false);

  // Internal mutable maps to accumulate deltas efficiently without re-rendering on each tick
  const bidsMapRef = useRef<Map<number, number>>(new Map());
  const asksMapRef = useRef<Map<number, number>>(new Map());
  const tradesRef = useRef<Trade[]>([]);

  // Render-facing state updated on a throttle to batch re-renders
  const [version, setVersion] = useState(0);

  // Establish combined stream for agg trades and depth diffs
  useEffect(() => {
    let isDisposed = false;
    let ws: WebSocket | null = null;
    let rafId: number | null = null;
    let lastUpdateId = 0; // order book update id from snapshot/process
    const depthBuffer: any[] = []; // buffer of depth events until snapshot sync

    const lower = symbol.toLowerCase();
    const streams = `${lower}@aggTrade/${lower}@depth@100ms`;
    const url = `${BINANCE_WS}?streams=${streams}`;

    function connect() {
      setError(undefined);
      ws = new WebSocket(url);

      ws.onopen = () => {
        if (isDisposed) return;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string);
          const stream: string = payload.stream;
          const data = payload.data;

          if (stream.endsWith("@aggTrade")) {
            // Aggregate trade
            const price = parseNumber(data.p);
            const size = parseNumber(data.q);
            const time = data.T as number;
            const id = data.a as number; // agg trade id
            const isBuyerMaker = Boolean(data.m);
            const side: Trade["side"] = isBuyerMaker ? "sell" : "buy";

            const next: Trade = { id, price, size, time, side };
            const list = tradesRef.current;
            // Avoid duplicates when reconnecting
            if (!list.length || list[0].id !== next.id) {
              list.unshift(next);
              if (list.length > 50) list.length = 50;
            }
          } else if (stream.includes("@depth")) {
            // Depth diff event per docs: contains U (first), u (final), b, a
            if (!synced) {
              depthBuffer.push(data);
              return;
            }
            applyDepthEvent(data);
          }
        } catch (e: any) {
          // Swallow parse errors to keep stream running; surface last error
          setError(String(e?.message ?? e));
        }
      };

      ws.onerror = () => {
        setError("WebSocket error");
      };

      ws.onclose = () => {
        setConnected(false);
        if (!isDisposed) {
          // simple reconnect with backoff
          setTimeout(connect, 1000);
        }
      };
    }

    connect();

    // Begin snapshot sync for correct local order book
    (async () => {
      try {
        setSynced(false);
        let attempts = 0;
        const maxAttempts = 6; // ~2s with 300ms backoff
        while (!isDisposed && attempts < maxAttempts) {
          attempts++;
          const BINANCE_REST_URL = `https://api.binance.com/api/v3/depth?symbol=${lower.toUpperCase()}&limit=1000`;
          const res = await fetch(BINANCE_REST_URL, { cache: "no-store" });
          if (!res.ok) throw new Error(`Snapshot fetch failed: ${res.status}`);
          const snap = await res.json();
          const snapLastUpdateId: number = snap.lastUpdateId;

          // Initialize maps from snapshot
          bidsMapRef.current.clear();
          asksMapRef.current.clear();
          for (const [p, q] of snap.bids as [string, string][]) {
            const price = parseNumber(p);
            const qty = parseNumber(q);
            if (qty > 0) bidsMapRef.current.set(price, qty);
          }
          for (const [p, q] of snap.asks as [string, string][]) {
            const price = parseNumber(p);
            const qty = parseNumber(q);
            if (qty > 0) asksMapRef.current.set(price, qty);
          }
          lastUpdateId = snapLastUpdateId;

          // Discard any buffered event where u <= lastUpdateId
          while (depthBuffer.length && depthBuffer[0].u <= lastUpdateId) {
            depthBuffer.shift();
          }

          // The first event to apply should have U <= lastUpdateId + 1 <= u
          if (
            depthBuffer.length > 0 &&
            depthBuffer[0].U <= lastUpdateId + 1 &&
            lastUpdateId + 1 <= depthBuffer[0].u
          ) {
            for (const evt of depthBuffer.splice(0)) {
              applyDepthEvent(evt);
            }
            setSynced(true);
            setError(undefined);
            break;
          }

          setError("Depth sync gap detected; retrying snapshot");
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch (e: any) {
        setError(String(e?.message ?? e));
      }
    })();

    // Animation-frame throttled state bump to re-render at ~60fps max
    const tick = () => {
      if (isDisposed) return;
      setVersion((v) => v + 1);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      try {
        ws?.close();
      } catch {}
    };
    
    // Applies a single depth event to local maps following Binance rules
    function applyDepthEvent(evt: any) {
      const U: number = evt.U;
      const u: number = evt.u;
      // Ignore if event u is less than the current lastUpdateId
      if (u < lastUpdateId) return;
      // If gap forward, we are out of sync; mark unsynced and bail
      if (U > lastUpdateId + 1) {
        setSynced(false);
        setError("Depth out-of-sync; resync required");
        return;
      }
      // Apply bids
      const b = (evt.b as [string, string][]) || [];
      if (b.length) {
        const map = bidsMapRef.current;
        for (const [p, q] of b) {
          const price = parseNumber(p);
          const qty = parseNumber(q);
          if (qty === 0) map.delete(price);
          else map.set(price, qty);
        }
      }
      // Apply asks
      const a = (evt.a as [string, string][]) || [];
      if (a.length) {
        const map = asksMapRef.current;
        for (const [p, q] of a) {
          const price = parseNumber(p);
          const qty = parseNumber(q);
          if (qty === 0) map.delete(price);
          else map.set(price, qty);
        }
      }
      lastUpdateId = u;
    }
  }, [symbol]);

  // Derive sorted sides and cumulative totals only when version changes (throttled)
  const { bids, asks, maxBidTotal, maxAskTotal, bestBid, bestAsk, spread } = useMemo(() => {
    // Convert maps to arrays
    const bidsArr: PriceLevel[] = [];
    const asksArr: PriceLevel[] = [];

    bidsMapRef.current.forEach((qty, price) => bidsArr.push([price, qty]));
    asksMapRef.current.forEach((qty, price) => asksArr.push([price, qty]));

    // Sort: bids desc, asks asc
    bidsArr.sort((a, b) => b[0] - a[0]);
    asksArr.sort((a, b) => a[0] - b[0]);

    // Compute cumulative totals and track max totals per side for depth bar scaling
    let cum = 0;
    let maxBidTot = 0;
    for (let i = 0; i < bidsArr.length; i++) {
      cum += bidsArr[i][1];
      if (cum > maxBidTot) maxBidTot = cum;
    }

    cum = 0;
    let maxAskTot = 0;
    for (let i = 0; i < asksArr.length; i++) {
      cum += asksArr[i][1];
      if (cum > maxAskTot) maxAskTot = cum;
    }

    const bb = bidsArr.length ? bidsArr[0][0] : null;
    const ba = asksArr.length ? asksArr[0][0] : null;
    const spr = bb != null && ba != null ? ba - bb : null;

    return {
      bids: bidsArr,
      asks: asksArr,
      maxBidTotal: maxBidTot,
      maxAskTotal: maxAskTot,
      bestBid: bb,
      bestAsk: ba,
      spread: spr,
    };
  }, [version]);

  const trades = tradesRef.current;

  return {
    bids,
    asks,
    maxBidTotal,
    maxAskTotal,
    bestBid,
    bestAsk,
    spread,
    trades,
    connected,
    error,
    synced,
  };
}


