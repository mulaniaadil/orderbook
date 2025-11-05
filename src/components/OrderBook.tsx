"use client";

import { memo, useMemo } from "react";
import { OrderBookSide } from "@/hooks/useBinanceSocket";

type Props = {
  bids: OrderBookSide;
  asks: OrderBookSide;
  maxBidTotal: number;
  maxAskTotal: number;
};

function numberFormat(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

function withCumulative(levels: OrderBookSide, isBids: boolean) {
  let cum = 0;
  return levels.map(([price, size]) => {
    cum += size;
    return { price, size, total: cum, isBids };
  });
}

const SideTable = memo(function SideTable({
  rows,
  maxTotal,
  color,
}: {
  rows: { price: number; size: number; total: number; isBids: boolean }[];
  maxTotal: number;
  color: "green" | "red";
}) {
  return (
    <div className="flex-1 overflow-auto text-sm">
      <div className="grid grid-cols-3 sticky top-0 z-10 bg-neutral-900 text-neutral-300 px-2 py-1">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>
      <div className="divide-y divide-neutral-800">
        {rows.map((r) => {
          const width = maxTotal > 0 ? Math.min(100, (r.total / maxTotal) * 100) : 0;
          const barColor = color === "green" ? "bg-green-900/40" : "bg-red-900/40";
          return (
            <div key={`${r.price}`} className="relative">
              <div className={`absolute inset-y-0 ${r.isBids ? "right-0" : "left-0"} ${barColor}`} style={{ width: `${width}%` }} />
              <div className="grid grid-cols-3 px-2 py-1 relative">
                <div className={color === "green" ? "text-green-400" : "text-red-400"}>{numberFormat(r.price)}</div>
                <div className="text-right text-neutral-200">{numberFormat(r.size)}</div>
                <div className="text-right text-neutral-400">{numberFormat(r.total)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export function OrderBook({ bids, asks, maxBidTotal, maxAskTotal }: Props) {
  const bidRows = useMemo(() => withCumulative(bids, true), [bids]);
  const askRows = useMemo(() => withCumulative(asks, false), [asks]);

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 text-white rounded-md border border-neutral-800">
      <div className="px-3 py-2 border-b border-neutral-800 text-neutral-200 font-medium">Order Book</div>
      <div className="flex-1 flex min-h-0">
        <SideTable rows={bidRows} maxTotal={maxBidTotal} color="green" />
        <div className="w-px bg-neutral-800" />
        <SideTable rows={askRows} maxTotal={maxAskTotal} color="red" />
      </div>
    </div>
  );
}


