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
    onMutate: async ({ productId, quantity, variantId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart', sessionId] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart', sessionId]);
      
      // Optimistically update the cart
      queryClient.setQueryData(['cart', sessionId], (old: any) => {
        if (!old) return old;
        
        const existingItemIndex = old.items.findIndex((item: any) => 
          item.productId === productId && 
          (variantId ? item.variantId === variantId : !item.variantId)
        );
        
        if (existingItemIndex > -1) {
          // Update existing item
          const newItems = [...old.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
          };
          return {
            ...old,
            items: newItems,
            total: old.total + (newItems[existingItemIndex].price * quantity),
          };
        }
        
        return old; // If item not in cart, let the server response handle it
      });
      
      return { previousCart };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', sessionId], context.previousCart);
      }
      toast.error(error.response?.data?.message || 'Failed to add item to cart');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartAPI.updateCartItem(sessionId, itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart', sessionId] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart', sessionId]);
      
      // Optimistically update the cart
      queryClient.setQueryData(['cart', sessionId], (old: any) => {
        if (!old) return old;
        
        const newItems = old.items.map((item: any) => 
          item.id === itemId ? { ...item, quantity } : item
        );
        
        const newTotal = newItems.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        );
        
        return {
          ...old,
          items: newItems,
          total: newTotal,
        };
      });
      
      return { previousCart };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', sessionId], context.previousCart);
      }
      toast.error(error.response?.data?.message || 'Failed to update cart');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (itemId: string) => cartAPI.removeFromCart(sessionId, itemId),
    onMutate: async (itemId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart', sessionId] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart', sessionId]);
      
      // Optimistically update the cart
      queryClient.setQueryData(['cart', sessionId], (old: any) => {
        if (!old) return old;
        
        const newItems = old.items.filter((item: any) => item.id !== itemId);
        
        const newTotal = newItems.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0
        );
        
        return {
          ...old,
          items: newItems,
          total: newTotal,
        };
      });
      
      return { previousCart };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', sessionId], context.previousCart);
      }
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(sessionId),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart', sessionId] });
      
      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart', sessionId]);
      
      // Optimistically clear the cart
      queryClient.setQueryData(['cart', sessionId], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          items: [],
          total: 0,
        };
      });
      
      return { previousCart };
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', sessionId], context.previousCart);
      }
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['cart', sessionId] });
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