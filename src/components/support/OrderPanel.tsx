import { useEffect, useState } from "react";
import { ChevronDown, MapPin, PackageCheck, RefreshCw, Truck, XCircle, Box, RotateCcw } from "lucide-react";
import { getOrders, resetDemoOrders } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/support";

const STATUS = {
  "Out for Delivery": { Icon: Truck,        dot: "bg-amber-400",   badge: "bg-amber-50 border-amber-200/70 text-amber-700" },
  Delivered:          { Icon: PackageCheck, dot: "bg-emerald-400", badge: "bg-emerald-50 border-emerald-200/70 text-emerald-700" },
  Processing:         { Icon: Box,          dot: "bg-blue-400",    badge: "bg-blue-50 border-blue-200/70 text-blue-700" },
  Cancelled:          { Icon: XCircle,      dot: "bg-rose-400",    badge: "bg-rose-50 border-rose-200/70 text-rose-600" },
} as const;

function cfg(status: string) {
  return STATUS[status as keyof typeof STATUS] ?? { Icon: Box, dot: "bg-muted-foreground/40", badge: "bg-muted border-border text-muted-foreground" };
}

export function OrderPanel({ refreshTick = 0 }: { refreshTick?: number }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openId, setOpenId] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);

  const refreshOrders = async () => {
    setRefreshing(true);
    try {
      setOrders(await getOrders());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refreshOrders();
  }, [refreshTick]);

  const resetOrders = async () => {
    setRefreshing(true);
    try {
      await resetDemoOrders();
      setOrders(await getOrders());
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section aria-labelledby="orders-title">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-muted-foreground">
            Quick reference
          </p>
          <h2 id="orders-title" className="mt-2 font-display text-4xl">
            Your orders
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void resetOrders()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            title="Reset demo orders"
          >
            <RotateCcw className="size-3" />
            Reset demo orders
          </button>
          {refreshing && <RefreshCw className="size-3.5 animate-spin text-muted-foreground/60" />}
          <span className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
            {orders.length} orders
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {orders.map((order) => {
          const isOpen = openId === order.id;
          const { Icon, dot, badge } = cfg(order.status ?? "");

          return (
            <article
              key={order.id}
              className="group overflow-hidden rounded-xl border border-border/50 bg-card shadow-soft transition-all duration-300 hover:border-border/80 hover:shadow-card"
            >
              {/* Card body */}
              <div className="flex items-start gap-4 p-4">
                {/* Icon square */}
                <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl border", badge)}>
                  <Icon className="size-5" />
                </div>

                <div className="min-w-0 flex-1">
                  {/* ID + price */}
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span className="font-mono text-sm font-bold tracking-wide text-foreground">
                      {order.id}
                    </span>
                    <span className="font-display text-xl font-semibold text-foreground">
                      {order.price}
                    </span>
                  </div>

                  {/* Product */}
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">{order.product}</p>

                  {/* Status + timing */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", badge)}>
                      <span className={cn("size-1.5 rounded-full", dot)} />
                      {order.status}
                    </span>
                    {order.timing && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                        <MapPin className="size-3 shrink-0 opacity-60" />
                        {order.timing}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              <div
                className={cn(
                  "grid transition-all duration-350 ease-in-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none",
                )}
              >
                <div className="overflow-hidden">
                  <div
                    className="mx-4 mb-4 grid gap-4 rounded-xl p-4 sm:grid-cols-2"
                    style={{
                      background: "color-mix(in oklab, var(--muted) 55%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--border) 50%, transparent)",
                    }}
                  >
                    {order.customer && <Detail label="Customer" value={order.customer} />}
                    {order.carrier && (
                      <Detail
                        label="Delivery partner"
                        value={`${order.carrier}${order.trackingId ? ` · ${order.trackingId}` : ""}`}
                      />
                    )}
                    {order.expectedDelivery && <Detail label="Expected delivery" value={order.expectedDelivery} />}
                    {order.deliveredDate && <Detail label="Delivered" value={order.deliveredDate} />}
                    {order.orderTime && <Detail label="Order placed" value={order.orderTime} />}
                    {order.cancellationEligible && order.note && (
                      <div className="sm:col-span-2">
                        <p className="text-xs font-semibold text-primary">{order.note}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle row */}
              <button
                className="flex w-full items-center justify-between border-t border-border/30 px-4 py-2.5 text-[11px] font-medium text-muted-foreground/70 transition-colors hover:bg-muted/20 hover:text-foreground"
                onClick={() => setOpenId(isOpen ? undefined : order.id)}
                aria-expanded={isOpen}
              >
                <span>{isOpen ? "Hide details" : "View details"}</span>
                <ChevronDown className={cn("size-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
