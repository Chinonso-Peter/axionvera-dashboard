import { useEffect, useState } from 'react';

const SIDEBAR_STATE_KEY = 'sidebar-open';

export function useSidebar() {
  // Initialize state from localStorage or default to true (expanded)
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    
    try {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      return savedState !== null ? JSON.parse(savedState) : true;
    } catch (error) {
      console.warn('Failed to parse sidebar state from localStorage:', error);
      return true;
    }
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    open,
    close,
  };
}
