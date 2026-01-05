"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const BETSLIP_STORAGE_KEY = 'casino_betslip';

export type BetItem = {
  id: string;
  name: string;
  odds: number;
  previousOdds?: number; // Track odds changes
  stake?: number;
  eventId?: string;
  eventName?: string;
  market?: string;
  isLive?: boolean;
};

interface BetslipContextType {
  items: BetItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: BetItem) => void;
  removeItem: (id: string) => void;
  updateStake: (id: string, stake: number) => void;
  updateOdds: (id: string, newOdds: number) => void;
  acceptOddsChange: (id: string) => void;
  clearSlip: () => void;
  hasOddsChanged: (id: string) => boolean;
  totalStake: number;
  totalOdds: number;
  potentialReturn: number;
}

const BetslipContext = createContext<BetslipContextType | undefined>(undefined);

// Helper to load items from localStorage
function loadFromStorage(): BetItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(BETSLIP_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load betslip from storage:', e);
  }
  return [];
}

// Helper to save items to localStorage
function saveToStorage(items: BetItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BETSLIP_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save betslip to storage:', e);
  }
}

export function BetslipProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BetItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedItems = loadFromStorage();
    if (storedItems.length > 0) {
      setItems(storedItems);
    }
    setIsHydrated(true);
  }, []);

  // Save to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveToStorage(items);
    }
  }, [items, isHydrated]);

  const addItem = useCallback((item: BetItem) => {
    setItems((prevItems) => {
      // Check if item already exists
      if (prevItems.find((i) => i.id === item.id)) {
        return prevItems;
      }
      return [...prevItems, { ...item, stake: item.stake ?? 0 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== id));
  }, []);

  const updateStake = useCallback((id: string, stake: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, stake: Math.max(0, stake) } : item
      )
    );
  }, []);

  const updateOdds = useCallback((id: string, newOdds: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, previousOdds: item.odds, odds: newOdds }
          : item
      )
    );
  }, []);

  const acceptOddsChange = useCallback((id: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, previousOdds: undefined } : item
      )
    );
  }, []);

  const clearSlip = useCallback(() => {
    setItems([]);
  }, []);

  const hasOddsChanged = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    return item?.previousOdds !== undefined && item.previousOdds !== item.odds;
  }, [items]);

  // Calculate totals
  const totalStake = items.reduce((sum, item) => sum + (item.stake || 0), 0);
  const totalOdds = items.length > 0
    ? items.reduce((acc, item) => acc * item.odds, 1)
    : 0;
  const potentialReturn = items.length > 0
    ? totalStake * totalOdds
    : 0;

  return (
    <BetslipContext.Provider
      value={{
        items,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateStake,
        updateOdds,
        acceptOddsChange,
        clearSlip,
        hasOddsChanged,
        totalStake,
        totalOdds,
        potentialReturn,
      }}
    >
      {children}
    </BetslipContext.Provider>
  );
}

export function useBetslip() {
  const context = useContext(BetslipContext);
  if (context === undefined) {
    throw new Error('useBetslip must be used within a BetslipProvider');
  }
  return context;
}
