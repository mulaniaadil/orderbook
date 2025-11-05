"use client";

import { useEffect, useMemo, useRef } from "react";
import { OrderBookSide } from "@/hooks/useBinanceSocket";

type Props = {
  bids: OrderBookSide; // sorted desc by price
  asks: OrderBookSide; // sorted asc by price
};

// Compute cumulative sizes mapped to price for each side
function buildCumulative(side: OrderBookSide, fromBest: "bids" | "asks") {
  let cum = 0;
  return side.map(([price, size]) => {
    cum += size;
    return { price, total: cum };
  });
}

export function DepthChart({ bids, asks }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(() => {
    const bidCum = buildCumulative(bids, "bids");
    const askCum = buildCumulative(asks, "asks");
    const bestBid = bids.length ? bids[0][0] : NaN;
    const bestAsk = asks.length ? asks[0][0] : NaN;
    const allTotals = [...bidCum.map((d) => d.total), ...askCum.map((d) => d.total)];
    const maxTotal = allTotals.length ? Math.max(...allTotals) : 0;
    return { bidCum, askCum, bestBid, bestAsk, maxTotal };
  }, [bids, asks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = parentRef.current;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      const { clientWidth, clientHeight } = parent;
      canvas.width = Math.floor(clientWidth * dpr);
      canvas.height = Math.floor(clientHeight * dpr);
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      draw();
    }

    function draw() {
      const { bidCum, askCum, bestBid, bestAsk, maxTotal } = data;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!isFinite(bestBid) || !isFinite(bestAsk) || maxTotal === 0) return;

      // Determine x-axis range around spread area using a small window
      const leftPrice = bidCum.length ? bidCum[bidCum.length - 1].price : bestBid;
      const rightPrice = askCum.length ? askCum[askCum.length - 1].price : bestAsk;

      const minPrice = Math.min(leftPrice, bestBid);
      const maxPrice = Math.max(rightPrice, bestAsk);
      const pad = (maxPrice - minPrice) * 0.02;
      const xMin = minPrice - pad;
      const xMax = maxPrice + pad;

      const x = (p: number) => ((p - xMin) / (xMax - xMin)) * (w - 20) + 10; // padding
      const y = (t: number) => h - (t / maxTotal) * (h - 20) - 10; // padding

      // Draw bids area (green)
      if (bidCum.length) {
        ctx.beginPath();
        ctx.moveTo(x(bidCum[0].price), h - 10);
        for (const d of bidCum) ctx.lineTo(x(d.price), y(d.total));
        ctx.lineTo(x(bidCum[bidCum.length - 1].price), h - 10);
        ctx.closePath();
        ctx.fillStyle = "rgba(34,197,94,0.25)"; // green-500 @ 25%
        ctx.fill();
        ctx.strokeStyle = "rgba(34,197,94,0.9)";
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
      }

      // Draw asks area (red)
      if (askCum.length) {
        ctx.beginPath();
        ctx.moveTo(x(askCum[0].price), h - 10);
        for (const d of askCum) ctx.lineTo(x(d.price), y(d.total));
        ctx.lineTo(x(askCum[askCum.length - 1].price), h - 10);
        ctx.closePath();
        ctx.fillStyle = "rgba(239,68,68,0.25)"; // red-500 @ 25%
        ctx.fill();
        ctx.strokeStyle = "rgba(239,68,68,0.9)";
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
      }

      // Draw midline at spread
      ctx.strokeStyle = "rgba(250,204,21,0.6)"; // amber-400
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath();
      const mid = (bestBid + bestAsk) / 2;
      const mx = x(mid);
      ctx.moveTo(mx, 10);
      ctx.lineTo(mx, h - 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    return () => ro.disconnect();
  }, [data]);

  return (
    <div ref={parentRef} className="w-full h-64 md:h-72 bg-neutral-950 border border-neutral-800 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 text-neutral-300 text-sm border-b border-neutral-800">
        <span>Depth Chart</span>
      </div>
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}


