"use client";

import { Trade } from "@/hooks/useBinanceSocket";
import { useEffect, useState } from "react";

type Props = {
  trades: Trade[];
};

function numberFormat(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

export function RecentTrades({ trades }: Props) {
  const [flashId, setFlashId] = useState<number | null>(null);

  useEffect(() => {
    if (trades.length === 0) return;
    const latest = trades[0];
    setFlashId(latest.id);
    const t = setTimeout(() => setFlashId(null), 300);
    return () => clearTimeout(t);
  }, [trades.length, trades[0]?.id]);

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-white rounded-md border border-neutral-800">
      <div className="px-3 py-2 border-b border-neutral-800 text-neutral-200 font-medium">Recent Trades</div>
      <div className="flex-1 overflow-auto text-sm">
        <div className="grid grid-cols-3 sticky top-0 z-10 bg-neutral-900 text-neutral-300 px-2 py-1">
          <div>Price</div>
          <div className="text-right">Size</div>
          <div className="text-right">Time</div>
        </div>
        <div className="divide-y divide-neutral-800">
          {trades.map((t) => {
            const isFlash = t.id === flashId;
            const color = t.side === "buy" ? "text-green-400" : "text-red-400";
            const flashBg = isFlash ? (t.side === "buy" ? "bg-green-900/40" : "bg-red-900/40") : "";
            const ts = new Date(t.time);
            const hh = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            return (
              <div key={t.id} className={`grid grid-cols-3 px-2 py-1 ${flashBg}`}>
                <div className={color}>{numberFormat(t.price)}</div>
                <div className="text-right text-neutral-200">{numberFormat(t.size)}</div>
                <div className="text-right text-neutral-400">{hh}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


