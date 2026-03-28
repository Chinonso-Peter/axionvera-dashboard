import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import userEvent from '@testing-library/user-event';

interface MockMediaQueryList extends MediaQueryList {
  triggerChange: (newMatches: boolean) => void;
}

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  let changeListener: EventListenerOrEventListenerObject | null = null;
  const state = {
    matches,
    media: ''
  };

  const mediaQueryList = {
    get matches() {
      return state.matches;
    },
    get media() {
      return state.media;
    },
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'change') changeListener = listener;
    }),
    removeEventListener: jest.fn((event: string, listener: EventListenerOrEventListenerObject) => {
      if (event === 'change' && changeListener === listener) changeListener = null;
    }),
    dispatchEvent: jest.fn(),
    triggerChange: (newMatches: boolean) => {
      state.matches = newMatches;
      if (changeListener) {
        if (typeof changeListener === 'function') {
          changeListener({ matches: newMatches } as any);
        } else {
          changeListener.handleEvent({ matches: newMatches } as any);
        }
      }
    }
  } as MockMediaQueryList;

  return jest.fn().mockImplementation(query => {
    state.media = query;
    return mediaQueryList;
  });
};

const TestComponent = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
};

describe('ThemeContext', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    localStorage.clear();
    matchMediaMock = mockMatchMedia(false);
    window.matchMedia = matchMediaMock;
    document.documentElement.setAttribute('data-theme', '');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with system theme light if matches is false', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('initializes with system theme dark if matches is true', () => {
    window.matchMedia = mockMatchMedia(true);
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('system');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('theme-preference', 'dark');
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
  });

  it('updates theme and localStorage when setTheme is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await act(async () => {
      screen.getByText('Set Dark').click();
    });

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('updates resolved theme when system preference changes', async () => {
    window.matchMedia = matchMediaMock;
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('resolved').textContent).toBe('light');

    act(() => {
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)') as MockMediaQueryList;
      mediaQueryList.triggerChange(true);
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('resolved').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
