/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ORDERS HOOK — Real-time Order Management                   │
 * │  Live order feed for influencer dashboard                    │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { Order, OrderItem, OrderStatus } from "../lib/types";

interface OrderWithItems extends Order {
    order_items: OrderItem[];
}

export function useOrders(storeId: string | undefined) {
    const queryClient = useQueryClient();

    // Fetch orders with items
    const ordersQuery = useQuery({
        queryKey: ["orders", storeId],
        queryFn: async () => {
            if (!storeId) return [];
            const { data, error } = await supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("store_id", storeId)
                .order("created_at", { ascending: false })
                .limit(50);
            if (error) throw error;
            return (data as OrderWithItems[]) || [];
        },
        enabled: !!storeId,
    });

    // Real-time order updates — LIVE ORDER FEED
    useRealtimeSubscription<Order>({
        table: "orders",
        filter: storeId ? `store_id=eq.${storeId}` : undefined,
        onEvent: (payload) => {
            if (payload.eventType === "INSERT") {
                // New order! Fetch it with items and prepend
                queryClient.invalidateQueries({ queryKey: ["orders", storeId] });
                queryClient.invalidateQueries({ queryKey: ["store-stats", storeId] });
            } else if (payload.eventType === "UPDATE") {
                queryClient.setQueryData(["orders", storeId], (old: OrderWithItems[] | undefined) => {
                    if (!old) return old;
                    return old.map((o) =>
                        o.id === (payload.new as Order).id
                            ? { ...o, ...(payload.new as Order) }
                            : o
                    );
                });
            }
        },
        enabled: !!storeId,
    });

    // Update order status
    const updateOrderStatus = useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
            const { data, error } = await supabase
                .from("orders")
                .update({ status })
                .eq("id", orderId)
                .select()
                .single();
            if (error) throw error;
            return data as Order;
        },
        onMutate: async ({ orderId, status }) => {
            await queryClient.cancelQueries({ queryKey: ["orders", storeId] });
            const previous = queryClient.getQueryData<OrderWithItems[]>(["orders", storeId]);
            queryClient.setQueryData(["orders", storeId], (old: OrderWithItems[] | undefined) =>
                old?.map((o) => (o.id === orderId ? { ...o, status } : o))
            );
            return { previous };
        },
        onError: (_err, _vars, context) => {
            queryClient.setQueryData(["orders", storeId], context?.previous);
        },
    });

    return {
        orders: ordersQuery.data || [],
        isLoading: ordersQuery.isLoading,
        error: ordersQuery.error,
        updateOrderStatus,
        refetch: ordersQuery.refetch,
    };
}

/* ── Create Order (from storefront checkout) ──── */

export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            storeId,
            items,
            customer,
        }: {
            storeId: string;
            items: Array<{ product_id: string; product_name: string; product_price: number; quantity: number }>;
            customer: { name: string; email: string; phone?: string; address?: Record<string, string> };
        }) => {
            const subtotal = items.reduce((sum, item) => sum + item.product_price * item.quantity, 0);
            const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax
            const total = subtotal + tax;

            // 1. Create order
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert({
                    store_id: storeId,
                    customer_name: customer.name,
                    customer_email: customer.email,
                    customer_phone: customer.phone || "",
                    shipping_address: customer.address || {},
                    subtotal,
                    tax,
                    total,
                    status: "pending",
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create order items
            const orderItems = items.map((item) => ({
                order_id: order.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: item.product_price,
                quantity: item.quantity,
                subtotal: item.product_price * item.quantity,
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Create payment record
            const { error: paymentError } = await supabase.from("payments").insert({
                order_id: order.id,
                amount: total,
                status: "pending",
                method: "card",
            });

            if (paymentError) throw paymentError;

            // 4. Track analytics event
            await supabase.from("analytics_events").insert({
                store_id: storeId,
                event_type: "purchase",
                metadata: { order_id: order.id, total },
            });

            return order as Order;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}
