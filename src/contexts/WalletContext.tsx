import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { NETWORK, type StellarNetwork } from "@/utils/networkConfig";

type WalletType = "freighter" | "albedo";

type WalletState = {
  address: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletType | null;
};

interface WalletContextType {
  address: string | null;
  publicKey: string | null;
  network: StellarNetwork;
  balance: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  walletType: WalletType | null;
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const WALLET_WAS_CONNECTED_KEY = "axionvera:wallet:was_connected";
const LAST_WALLET_TYPE_KEY = "axionvera:wallet:last_type";

function mapFreighterNetwork(network: string): StellarNetwork {
  const networkMap: Record<string, StellarNetwork> = {
    PUBLIC: "mainnet",
    TESTNET: "testnet",
    FUTURENET: "futurenet",
  };

  return networkMap[network] ?? "testnet";
}

function getLastWalletType(): WalletType | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(LAST_WALLET_TYPE_KEY);
    return value === "freighter" || value === "albedo" ? value : null;
  } catch {
    return null;
  }
}

function setWalletPersistence(walletType: WalletType) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WALLET_WAS_CONNECTED_KEY, "true");
    window.localStorage.setItem(LAST_WALLET_TYPE_KEY, walletType);
  } catch {
    // Ignore localStorage errors in restricted environments.
  }
}

function clearWalletPersistence() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WALLET_WAS_CONNECTED_KEY);
    window.localStorage.removeItem(LAST_WALLET_TYPE_KEY);
  } catch {
    // Ignore localStorage errors in restricted environments.
  }
}

function shouldAttemptFreighterReconnect(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const wasConnected =
      window.localStorage.getItem(WALLET_WAS_CONNECTED_KEY) === "true";
    const lastWalletType = getLastWalletType();

    return wasConnected && lastWalletType === "freighter";
  } catch {
    return false;
  }
}

async function loadFreighter() {
  const mod = await import("@stellar/freighter-api");
  return mod;
}

async function loadAlbedo() {
  const mod = await import("@albedo-link/intent");
  return mod.default;
}

async function fetchBalance(
  address: string,
  network: StellarNetwork,
): Promise<string> {
  try {
    const horizonUrl =
      network === "mainnet"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org";

    const response = await fetch(`${horizonUrl}/accounts/${address}`);
    if (!response.ok) {
      throw new Error("Failed to fetch account");
    }

    const data = await response.json();
    const xlmBalance = data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native",
    );
    return xlmBalance?.balance ?? "0";
  } catch {
    return "0";
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    network: NETWORK,
    balance: null,
    isConnecting: false,
    error: null,
    walletType: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = useMemo(() => Boolean(state.address), [state.address]);

  useEffect(() => {
    if (!state.address) {
      setState((s) => ({ ...s, balance: null }));
      return;
    }
    const walletAddress = state.address;

    let cancelled = false;
    (async () => {
      const balance = await fetchBalance(walletAddress, state.network);
      if (!cancelled) {
        setState((s) => ({ ...s, balance }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.address, state.network]);

  useEffect(() => {
    if (!state.address || state.walletType !== "freighter") return;
    const activeAddress = state.address;

    const checkForChanges = async () => {
      try {
        const freighter = await loadFreighter();
        const currentAddress = await freighter.getPublicKey();
        const currentNetwork = await freighter.getNetwork();
        const mappedNetwork = mapFreighterNetwork(currentNetwork);

        if (currentAddress !== activeAddress || mappedNetwork !== state.network) {
          setState((s) => ({
            ...s,
            address: currentAddress,
            network: mappedNetwork,
          }));
        }
      } catch {
        // Ignore polling errors.
      }
    };

    pollingRef.current = setInterval(checkForChanges, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [state.address, state.walletType, state.network]);

  useEffect(() => {
    if (!shouldAttemptFreighterReconnect()) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const freighter = await loadFreighter();
        const connected = await freighter.isConnected();
        if (!connected) {
          clearWalletPersistence();
          return;
        }

        const allowed = await freighter.isAllowed();
        if (!allowed) {
          clearWalletPersistence();
          return;
        }

        const address = await freighter.getPublicKey();
        const network = await freighter.getNetwork();
        const mappedNetwork = mapFreighterNetwork(network);

        if (!cancelled) {
          setState((s) => ({
            ...s,
            address,
            network: mappedNetwork,
            walletType: "freighter",
            error: null,
            isConnecting: false,
          }));
        }
      } catch {
        clearWalletPersistence();
        if (!cancelled) {
          setState((s) => ({ ...s, address: null, walletType: null }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (walletType: WalletType = "freighter") => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));

    try {
      if (typeof window === "undefined") {
        throw new Error("Wallet is only available in the browser.");
      }

      if (walletType === "freighter") {
        const freighter = await loadFreighter();
        const connected = await freighter.isConnected();
        if (!connected) {
          throw new Error(
            "Freighter wallet not detected. Please install the Freighter extension.",
          );
        }

        await freighter.setAllowed();

        const address = await freighter.getPublicKey();
        const network = await freighter.getNetwork();
        const mappedNetwork = mapFreighterNetwork(network);

        setState({
          address,
          network: mappedNetwork,
          balance: null,
          isConnecting: false,
          error: null,
          walletType: "freighter",
        });
        setWalletPersistence("freighter");
        return;
      }

      const albedo = await loadAlbedo();
      const result = await albedo.publicKey({});
      const address = result.pubkey;

      setState({
        address,
        network: NETWORK,
        balance: null,
        isConnecting: false,
        error: null,
        walletType: "albedo",
      });
      setWalletPersistence("albedo");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect wallet.";

      setState((s) => ({
        ...s,
        isConnecting: false,
        address: null,
        error: message,
        walletType: null,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    clearWalletPersistence();
    setState((s) => ({
      ...s,
      address: null,
      balance: null,
      error: null,
      walletType: null,
    }));
  }, []);

  const value = useMemo<WalletContextType>(
    () => ({
      address: state.address,
      publicKey: state.address,
      network: state.network,
      balance: state.balance,
      isConnected,
      isConnecting: state.isConnecting,
      error: state.error,
      walletType: state.walletType,
      connect,
      disconnect,
    }),
    [
      state.address,
      state.network,
      state.balance,
      isConnected,
      state.isConnecting,
      state.error,
      state.walletType,
      connect,
      disconnect,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

/** @deprecated Use useWalletContext instead */
export const useWallet = useWalletContext;
