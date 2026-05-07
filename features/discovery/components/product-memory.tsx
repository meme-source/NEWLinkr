"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { ChatProductMemory } from "../chat-types";

const EMPTY: ChatProductMemory = {
  url: null,
  rawText: null,
  parsedName: null,
  parsedCategory: null,
};

interface ProductMemoryContextValue {
  product: ChatProductMemory;
  setProduct: (next: ChatProductMemory) => void;
  reset: () => void;
}

const ProductMemoryContext = createContext<ProductMemoryContextValue | null>(null);

export function ProductMemoryProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<ChatProductMemory>(EMPTY);

  const setProduct = useCallback((next: ChatProductMemory) => {
    setProductState(next);
  }, []);

  const reset = useCallback(() => {
    setProductState(EMPTY);
  }, []);

  const value = useMemo(() => ({ product, setProduct, reset }), [product, setProduct, reset]);

  return <ProductMemoryContext.Provider value={value}>{children}</ProductMemoryContext.Provider>;
}

export function useProductMemory(): ProductMemoryContextValue {
  const ctx = useContext(ProductMemoryContext);
  if (!ctx) {
    throw new Error("useProductMemory must be used inside <ProductMemoryProvider>");
  }
  return ctx;
}

export function getProductHint(product: ChatProductMemory): string {
  if (product.parsedName && product.url) {
    return `${product.url}（已识别为「${product.parsedName}」）`;
  }
  if (product.url) return product.url;
  if (product.rawText) return product.rawText;
  return "";
}
