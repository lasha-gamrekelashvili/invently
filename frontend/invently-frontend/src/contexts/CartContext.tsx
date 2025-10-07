import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI } from '../utils/api';
import type { Cart } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartItemQuantity: (productId: string, variantId?: string) => number;
  cartItemCount: number;
  cartTotal: number;
  sessionId: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const generateSessionId = () => {
  const existing = localStorage.getItem('cart_session_id');
  if (existing) return existing;

  const newSessionId = 'session_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  localStorage.setItem('cart_session_id', newSessionId);
  return newSessionId;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId] = useState(generateSessionId);
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart', sessionId],
    queryFn: () => cartAPI.getCart(sessionId),
    retry: false,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity, variantId }: { productId: string; quantity: number; variantId?: string }) =>
      cartAPI.addToCart(sessionId, productId, quantity, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartAPI.updateCartItem(sessionId, itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => cartAPI.removeFromCart(sessionId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
  });

  const addToCart = async (productId: string, quantity: number = 1, variantId?: string) => {
    await addToCartMutation.mutateAsync({ productId, quantity, variantId });
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    await updateCartItemMutation.mutateAsync({ itemId, quantity });
  };

  const removeFromCart = async (itemId: string) => {
    await removeFromCartMutation.mutateAsync(itemId);
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  const getCartItemQuantity = (productId: string, variantId?: string): number => {
    const item = cart?.items.find(item => {
      if (variantId) {
        return item.productId === productId && item.variantId === variantId;
      }
      return item.productId === productId && !item.variantId;
    });
    return item?.quantity || 0;
  };

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = cart?.total || 0;

  const value: CartContextType = {
    cart: cart || null,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartItemQuantity,
    cartItemCount,
    cartTotal,
    sessionId,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};