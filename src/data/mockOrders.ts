import type { Order } from "@/types/support";

export const mockOrders: Order[] = [
  {
    id: "ORD-101",
    customer: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    price: "₹699",
    status: "Out for Delivery",
    carrier: "BlueDart",
    trackingId: "BD-982103",
    timing: "Expected by 6 PM today",
    expectedDelivery: "6 PM today",
  },
  {
    id: "ORD-102",
    customer: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    price: "₹499",
    status: "Delivered",
    carrier: "Delhivery",
    trackingId: "DL-441029",
    timing: "Delivered 14 days ago",
    deliveredDate: "14 days ago",
  },
  {
    id: "ORD-103",
    customer: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    price: "₹850",
    status: "Processing",
    timing: "Ordered 3 hours ago",
    orderTime: "3 hours ago",
    cancellationEligible: true,
    note: "Eligible for cancellation",
  },
];
