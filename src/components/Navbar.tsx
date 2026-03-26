import Link from "next/link";
import { useMemo, useState } from "react";

import { shortenAddress } from "@/utils/contractHelpers";

type NavbarProps = {
  address: string | null;
  isConnecting: boolean;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
};

export default function Navbar({ address, isConnecting, onConnect, onDisconnect }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const short = useMemo(() => (address ? shortenAddress(address, 6) : null), [address]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div 
              aria-hidden="true" 
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-axion-500 to-indigo-500 shadow-lg shadow-axion-500/20" 
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Axionvera</div>
              <div className="text-xs text-slate-400">Dashboard</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-slate-300 sm:flex">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-900/60">
              Vault
            </Link>
            <a
              href="https://stellar.org/soroban"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-2 hover:bg-slate-900/60"
            >
              Soroban
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {address ? (
            <div className="flex items-center gap-2">
              <div className="hidden rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-2 text-xs text-slate-200 sm:block">
                {short}
              </div>
              <button
                type="button"
                onClick={onDisconnect}
                aria-label="Disconnect Stellar wallet"
                className="rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-900/60"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={isConnecting}
              aria-label={isConnecting ? "Connecting to Stellar wallet" : "Connect Stellar wallet"}
              className="rounded-xl bg-axion-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 transition hover:bg-slate-900/60 sm:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="border-t border-slate-800 bg-slate-950 px-6 py-4 sm:hidden">
          <div className="flex flex-col gap-2">
            <Link 
              href="/dashboard" 
              onClick={() => setIsMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-slate-900/60"
            >
              Vault
            </Link>
            <a
              href="https://stellar.org/soroban"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-3 text-sm text-slate-200 hover:bg-slate-900/60"
            >
              Soroban
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
