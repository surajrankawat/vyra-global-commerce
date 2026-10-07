import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Coupon, ShippingCarrierOption } from '../types';
import { fetchCart, saveCart, validateCoupon } from '../lib/db';
import { useAuth } from './AuthContext';

export const SHIPPING_OPTIONS: ShippingCarrierOption[] = [
  {
    id: 'ship-std',
    name: 'DHL Global Standard Courier',
    type: 'COURIER',
    estimated_days: '4-7 business days',
    price: 35,
    currency: 'USD',
    tracking_supported: true,
    free_threshold: 300,
  },
  {
    id: 'ship-express',
    name: 'FedEx Priority Air Express',
    type: 'AIR_FREIGHT',
    estimated_days: '2-3 business days',
    price: 75,
    currency: 'USD',
    tracking_supported: true,
  },
  {
    id: 'ship-ocean',
    name: 'Maersk LCL Ocean Freight (Consolidated)',
    type: 'OCEAN_FREIGHT',
    estimated_days: '18-25 business days',
    price: 150,
    currency: 'USD',
    tracking_supported: true,
  },
];

interface CartContextType {
  items: CartItem[];
  savedForLater: CartItem[];
  appliedCoupon: Coupon | null;
  subtotal: number;
  discountAmount: number;
  shippingOption: ShippingCarrierOption;
  setShippingOption: (opt: ShippingCarrierOption) => void;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  saveForLater: (productId: string) => void;
  moveToCart: (productId: string) => void;
  applyCouponCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentBusiness, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedForLater, setSavedForLater] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [shippingOption, setShippingOption] = useState<ShippingCarrierOption>(SHIPPING_OPTIONS[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const identifier = currentBusiness?.id || user?.id || 'guest_user';

  // Load cart from storage on mount
  useEffect(() => {
    fetchCart(identifier).then((cart) => {
      setItems(cart.items || []);
      setSavedForLater(cart.saved_for_later || []);
      setLoaded(true);
    });
  }, [identifier]);

  // Sync to database / localStorage whenever cart changes
  useEffect(() => {
    if (!loaded) return;
    const subtotal = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
    saveCart({
      id: `cart-${identifier}`,
      business_id: currentBusiness?.id,
      user_id: user?.id,
      items,
      saved_for_later: savedForLater,
      coupon_code: appliedCoupon?.code,
      discount_amount: 0,
      subtotal,
      tax_amount: 0,
      shipping_amount: shippingOption.price,
      total: subtotal,
      currency: 'USD',
      updated_at: new Date().toISOString(),
    });
  }, [items, savedForLater, appliedCoupon, shippingOption, loaded, identifier, currentBusiness, user]);

  const subtotal = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'PERCENTAGE') {
      discountAmount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount && discountAmount > appliedCoupon.max_discount_amount) {
        discountAmount = appliedCoupon.max_discount_amount;
      }
    } else if (appliedCoupon.discount_type === 'FIXED') {
      discountAmount = Math.min(appliedCoupon.discount_value, subtotal);
    }
  }

  // Shipping calculation (free shipping coupon check)
  const isFreeShipCoupon = appliedCoupon?.discount_type === 'FREE_SHIPPING';
  const shippingAmount = items.length === 0 ? 0 : isFreeShipCoupon ? 0 : shippingOption.price;

  // Tax calculation: 8% on taxable amount
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.08 * 100) / 100;
  const total = Math.max(0, Math.round((taxableAmount + shippingAmount + taxAmount) * 100) / 100);
  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.product_id === product.id && it.selected_variant === variant);
      if (existing) {
        const nextQty = existing.quantity + quantity;
        const maxStock = typeof product.stock_quantity === 'number' ? product.stock_quantity : 9999;
        return prev.map((it) =>
          it.id === existing.id ? { ...it, quantity: Math.min(nextQty, maxStock) } : it
        );
      }
      const newItem: CartItem = {
        id: `ci-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product_id: product.id,
        product,
        quantity: Math.max(1, quantity),
        selected_variant: variant,
        unit_price: product.price || 0,
        currency: product.currency || 'USD',
        added_at: new Date().toISOString(),
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => {
        if (it.product_id === productId) {
          const maxStock = typeof it.product.stock_quantity === 'number' ? it.product.stock_quantity : 9999;
          return { ...it, quantity: Math.min(quantity, maxStock) };
        }
        return it;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.product_id !== productId));
  };

  const saveForLater = (productId: string) => {
    const item = items.find((it) => it.product_id === productId);
    if (!item) return;
    setItems((prev) => prev.filter((it) => it.product_id !== productId));
    setSavedForLater((prev) => [...prev.filter((it) => it.product_id !== productId), item]);
  };

  const moveToCart = (productId: string) => {
    const item = savedForLater.find((it) => it.product_id === productId);
    if (!item) return;
    setSavedForLater((prev) => prev.filter((it) => it.product_id !== productId));
    setItems((prev) => [...prev.filter((it) => it.product_id !== productId), item]);
  };

  const applyCouponCode = async (code: string) => {
    const res = await validateCoupon(code, subtotal);
    if (res.valid && res.coupon) {
      setAppliedCoupon(res.coupon);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        savedForLater,
        appliedCoupon,
        subtotal,
        discountAmount,
        shippingOption,
        setShippingOption,
        shippingAmount,
        taxAmount,
        total,
        itemCount,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        saveForLater,
        moveToCart,
        applyCouponCode,
        removeCoupon,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
