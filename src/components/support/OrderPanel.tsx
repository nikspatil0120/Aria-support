import { useEffect, useState } from "react";
import { Box, ChevronDown, PackageCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/lib/api";
import type { Order } from "@/types/support";

export function OrderPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [openId, setOpenId] = useState<string>();

  useEffect(() => {
    void getOrders().then(setOrders);
  }, []);

  return (
    <section aria-labelledby="orders-title">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Quick reference</p>
          <h2 id="orders-title" className="mt-1 font-display text-3xl text-foreground">
            Your orders
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">3 recent orders</span>
      </div>
      <div className="grid gap-3">
        {orders.map((order) => {
          const isOpen = openId === order.id;
          return (
            <article
              key={order.id}
              className="rounded-lg border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                  {order.status === "Delivered" ? (
                    <PackageCheck />
                  ) : order.status === "Out for Delivery" ? (
                    <Truck />
                  ) : (
                    <Box />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{order.id}</p>
                    <p className="font-display text-xl text-foreground">{order.price}</p>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {order.product}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-status px-2.5 py-1 text-xs font-semibold text-status-foreground">
                      {order.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{order.timing}</span>
                  </div>
                </div>
              </div>
              {isOpen && (
                <div className="mt-4 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted-foreground">Customer</span>
                    <br />
                    <span className="font-medium">{order.customer}</span>
                  </p>
                  {order.carrier && (
                    <p>
                      <span className="text-muted-foreground">Delivery partner</span>
                      <br />
                      <span className="font-medium">
                        {order.carrier} — {order.trackingId}
                      </span>
                    </p>
                  )}
                  {order.note && <p className="font-medium text-primary">{order.note}</p>}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-primary hover:bg-transparent"
                onClick={() => setOpenId(isOpen ? undefined : order.id)}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Hide" : "View"} details for ${order.id}`}
              >
                {isOpen ? "Hide details" : "View details"}
                <ChevronDown className={isOpen ? "rotate-180" : ""} />
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
