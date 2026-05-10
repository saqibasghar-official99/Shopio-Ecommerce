'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQty: (productId: string, qty: number, variant?: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  discount: number;
  setDiscount: (amount: number) => void;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
  deliveryZoneName: string;
  setDeliveryZoneName: (name: string) => void;
  hydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryZoneName, setDeliveryZoneName] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (saved) setItems(JSON.parse(saved));
      const savedCoupon = localStorage.getItem('couponCode');
      if (savedCoupon) setCouponCode(savedCoupon);
      const savedZone = localStorage.getItem('deliveryZoneName');
      if (savedZone) setDeliveryZoneName(savedZone);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('couponCode', couponCode);
    }
  }, [couponCode, hydrated]);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('deliveryZoneName', deliveryZoneName);
    }
  }, [deliveryZoneName, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variant === item.variant);
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.variant === item.variant
            ? { ...i, qty: Math.min(i.qty + item.qty, i.stock) }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string, variant?: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variant === variant)));
  }, []);

  const updateQty = useCallback((productId: string, qty: number, variant?: string) => {
    if (qty <= 0) {
      removeItem(productId, variant);
      return;
    }
    setItems(prev => prev.map(i =>
      i.productId === productId && i.variant === variant ? { ...i, qty } : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCode('');
    setDiscount(0);
    setDeliveryFee(0);
    setDeliveryZoneName('');
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('couponCode');
      localStorage.removeItem('deliveryZoneName');
    } catch {}
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      totalItems, subtotal, couponCode, setCouponCode,
      discount, setDiscount, deliveryFee, setDeliveryFee,
      deliveryZoneName, setDeliveryZoneName,
      hydrated,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
