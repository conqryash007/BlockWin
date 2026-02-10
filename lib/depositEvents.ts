// Simple event system for opening the deposit modal from anywhere in the app
import { useEffect } from 'react';

const DEPOSIT_MODAL_EVENT = 'open-deposit-modal';

export function openDepositModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DEPOSIT_MODAL_EVENT));
  }
}

export function useOnOpenDepositModal(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(DEPOSIT_MODAL_EVENT, handler);
    return () => window.removeEventListener(DEPOSIT_MODAL_EVENT, handler);
  }, [callback]);
}

const BONUS_UPDATE_EVENT = 'welcome-bonus-update';

export function triggerBonusUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BONUS_UPDATE_EVENT));
  }
}

export function useOnBonusUpdate(callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(BONUS_UPDATE_EVENT, handler);
    return () => window.removeEventListener(BONUS_UPDATE_EVENT, handler);
  }, [callback]);
}
