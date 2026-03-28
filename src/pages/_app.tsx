import type { AppProps } from "next/app";
import { Toaster } from 'sonner';

import "@/styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WalletProvider>
          <Component {...pageProps} />
          <ThemeToggle />
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </WalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
