// Simple verification script for useSidebar hook
// This script can be run in a browser console to verify localStorage functionality

console.log('=== Sidebar State Verification ===');

// Test 1: Check if localStorage is available
console.log('1. localStorage available:', typeof Storage !== 'undefined');

// Test 2: Simulate the useSidebar hook logic
const SIDEBAR_STATE_KEY = 'sidebar-open';

function getInitialSidebarState() {
  try {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    return savedState !== null ? JSON.parse(savedState) : true;
  } catch (error) {
    console.warn('Failed to parse sidebar state from localStorage:', error);
    return true;
  }
}

function saveSidebarState(isOpen) {
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
    console.log(`✅ Saved sidebar state: ${isOpen}`);
  } catch (error) {
    console.warn('Failed to save sidebar state to localStorage:', error);
  }
}

// Test 3: Initial state
console.log('2. Initial sidebar state:', getInitialSidebarState());

// Test 4: Save different states
console.log('3. Testing state persistence...');
saveSidebarState(false);
console.log('4. State after saving false:', getInitialSidebarState());

saveSidebarState(true);
console.log('5. State after saving true:', getInitialSidebarState());

// Test 5: Clear and test default
localStorage.removeItem(SIDEBAR_STATE_KEY);
console.log('6. State after clearing localStorage (should default to true):', getInitialSidebarState());

console.log('=== Verification Complete ===');
console.log('The useSidebar hook should work correctly with localStorage persistence.');
