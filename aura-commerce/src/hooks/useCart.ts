/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │  CART HOOK — Client-side Cart State                          │
 * │  Persistent in sessionStorage, optimistic UI                │
 * └──────────────────────────────────────────────────────────────┘
 */

import { useState, useCallback, useEffect } from "react";
import type { Product, CartItem } from "../lib/types";

const CART_KEY = "sf_cart";

function loadCart(): CartItem[] {
    try {
        const stored = sessionStorage.getItem(CART_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveCart(items: CartItem[]) {
    try {
        sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
        // Storage full or unavailable
    }
}

export function useCart() {
    const [items, setItems] = useState<CartItem[]>(loadCart);

    // Persist on change
    useEffect(() => {
        saveCart(items);
    }, [items]);

    const addItem = useCallback((product: Product, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            setItems((prev) => prev.filter((item) => item.product.id !== productId));
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        sessionStorage.removeItem(CART_KEY);
    }, []);

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = subtotal + tax;

    return {
        items,
        itemCount,
        subtotal,
        tax,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
    };
}
