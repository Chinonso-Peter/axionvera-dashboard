import { useEffect, useState } from 'react';

const SIDEBAR_STATE_KEY = 'sidebar-open';

export function useSidebar() {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Initialize from localStorage after mounting to avoid hydration mismatch
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (savedState !== null) {
        setIsOpen(JSON.parse(savedState));
      }
    } catch (error) {
      console.warn('Failed to parse sidebar state from localStorage:', error);
    }
  }, []);

  // Save state to localStorage whenever it changes (after mount)
  useEffect(() => {
    // Skip saving on first render if we just loaded from localStorage
    // This effect runs after the first one because they are in order
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
