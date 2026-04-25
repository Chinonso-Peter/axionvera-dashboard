import type { StellarNetwork } from "@/utils/networkConfig";
import { withApiResilience, withErrorHandling, safeApiCall, ApiCallOptions } from "./apiResilience";

export type VaultTxType = "deposit" | "withdraw" | "claim";

export type VaultTxStatus = "pending" | "success" | "failed";

export type VaultTx = {
  id: string;
  type: VaultTxType;
  amount: string;
  status: VaultTxStatus;
  createdAt: string;
  hash?: string;
  assetId?: string;
  assetSymbol?: string;
};

export type VaultBalances = {
  balance: string;
  rewards: string;
};

export type TransactionSimulation = {
  cpuInstructions: number;
  ramBytes: number;
  ledgerEntries: number;
  maxFee: string;
  estimatedFee: string;
};

export type AxionveraVaultSdk = {
  getBalances: (args: { walletAddress: string; network: StellarNetwork; assetId?: string }, options?: ApiCallOptions) => Promise<VaultBalances>;
  getTransactions: (args: { walletAddress: string; network: StellarNetwork; assetId?: string }, options?: ApiCallOptions) => Promise<VaultTx[]>;
  deposit: (
    args: { walletAddress: string; network: StellarNetwork; amount: string; assetId?: string; assetSymbol?: string; tokenContractId?: string | null },
    options?: ApiCallOptions
  ) => Promise<VaultTx>;
  withdraw: (
    args: { walletAddress: string; network: StellarNetwork; amount: string; assetId?: string; assetSymbol?: string; tokenContractId?: string | null },
    options?: ApiCallOptions
  ) => Promise<VaultTx>;
  claimRewards: (
    args: { walletAddress: string; network: StellarNetwork; assetId?: string; assetSymbol?: string },
    options?: ApiCallOptions
  ) => Promise<VaultTx>;
};

export function shortenAddress(address: string, chars = 6) {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatAmount(amount: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 7 }).format(n);
}

export function parsePositiveAmount(input: string) {
  const trimmed = input.trim();
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return trimmed;
}

function getStorageKey(walletAddress: string, network: StellarNetwork) {
  return `axionvera:vault:${network}:${walletAddress}`;
}

type StoredVault = {
  balances: Record<string, string>;
  rewards: Record<string, string>;
  txs: VaultTx[];
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadVault(walletAddress: string, network: StellarNetwork): StoredVault {
  if (typeof window === "undefined") return { balances: {}, rewards: {}, txs: [] };
  const raw = window.localStorage.getItem(getStorageKey(walletAddress, network));
  if (!raw) return { balances: {}, rewards: {}, txs: [] };
  try {
    const parsed = JSON.parse(raw) as StoredVault & { balance?: string; rewards?: string };
    const legacyBalance = typeof parsed.balance === "string" ? parsed.balance : undefined;
    const legacyRewards = typeof parsed.rewards === "string" ? parsed.rewards : undefined;
    return {
      balances:
        parsed.balances && typeof parsed.balances === "object"
          ? parsed.balances
          : legacyBalance
            ? { "native-xlm": legacyBalance }
            : {},
      rewards:
        parsed.rewards && typeof parsed.rewards === "object"
          ? parsed.rewards
          : legacyRewards
            ? { "native-xlm": legacyRewards }
            : {},
      txs: Array.isArray(parsed.txs) ? parsed.txs : []
    };
  } catch {
    return { balances: {}, rewards: {}, txs: [] };
  }
}

function saveVault(walletAddress: string, network: StellarNetwork, vault: StoredVault) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(walletAddress, network), JSON.stringify(vault));
}

function toFixedString(n: number) {
  return n.toString();
}

function resolveAssetId(assetId?: string) {
  return assetId ?? "native-xlm";
}

function resolveAssetSymbol(assetId?: string, assetSymbol?: string) {
  if (assetSymbol) return assetSymbol;
  return resolveAssetId(assetId) === "native-xlm" ? "XLM" : resolveAssetId(assetId).toUpperCase();
}

export function createAxionveraVaultSdk(): AxionveraVaultSdk {
  const baseSdk = {
    async getBalances({ walletAddress, network, assetId }: { walletAddress: string; network: StellarNetwork; assetId?: string }) {
      await sleep(150);
      const vault = loadVault(walletAddress, network);
      const resolvedAssetId = resolveAssetId(assetId);
      return {
        balance: vault.balances[resolvedAssetId] ?? "0",
        rewards: vault.rewards[resolvedAssetId] ?? "0"
      };
    },
    async getTransactions({ walletAddress, network, assetId }: { walletAddress: string; network: StellarNetwork; assetId?: string }) {
      await sleep(150);
      const vault = loadVault(walletAddress, network);
      const resolvedAssetId = resolveAssetId(assetId);
      return vault.txs.filter((tx) => (tx.assetId ?? "native-xlm") === resolvedAssetId);
    },
    async deposit({
      walletAddress,
      network,
      amount,
      assetId,
      assetSymbol
    }: {
      walletAddress: string;
      network: StellarNetwork;
      amount: string;
      assetId?: string;
      assetSymbol?: string;
      tokenContractId?: string | null;
    }) {
      const resolvedAssetId = resolveAssetId(assetId);
      const resolvedAssetSymbol = resolveAssetSymbol(assetId, assetSymbol);
      const tx: VaultTx = {
        id: createId(),
        type: "deposit",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
        assetId: resolvedAssetId,
        assetSymbol: resolvedAssetSymbol
      };

      const vault = loadVault(walletAddress, network);
      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Number(vault.balances[resolvedAssetId] ?? "0") + Number(amount);
      const rewards = Number(vault.rewards[resolvedAssetId] ?? "0") + Number(amount) * 0.01;
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balances: {
          ...vault.balances,
          [resolvedAssetId]: toFixedString(balance)
        },
        rewards: {
          ...vault.rewards,
          [resolvedAssetId]: toFixedString(rewards)
        },
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };
      saveVault(walletAddress, network, next);
      return completed;
    },
    async withdraw({
      walletAddress,
      network,
      amount,
      assetId,
      assetSymbol
    }: {
      walletAddress: string;
      network: StellarNetwork;
      amount: string;
      assetId?: string;
      assetSymbol?: string;
      tokenContractId?: string | null;
    }) {
      const resolvedAssetId = resolveAssetId(assetId);
      const resolvedAssetSymbol = resolveAssetSymbol(assetId, assetSymbol);
      const tx: VaultTx = {
        id: createId(),
        type: "withdraw",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
        assetId: resolvedAssetId,
        assetSymbol: resolvedAssetSymbol
      };

      const vault = loadVault(walletAddress, network);
      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Math.max(0, Number(vault.balances[resolvedAssetId] ?? "0") - Number(amount));
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balances: {
          ...vault.balances,
          [resolvedAssetId]: toFixedString(balance)
        },
        rewards: vault.rewards,
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };
      saveVault(walletAddress, network, next);
      return completed;
    },
    async claimRewards({
      walletAddress,
      network,
      assetId,
      assetSymbol
    }: {
      walletAddress: string;
      network: StellarNetwork;
      assetId?: string;
      assetSymbol?: string;
    }) {
      const resolvedAssetId = resolveAssetId(assetId);
      const resolvedAssetSymbol = resolveAssetSymbol(assetId, assetSymbol);
      const vault = loadVault(walletAddress, network);
      const amount = vault.rewards[resolvedAssetId] ?? "0";
      const tx: VaultTx = {
        id: createId(),
        type: "claim",
        amount,
        status: "pending",
        createdAt: new Date().toISOString(),
        assetId: resolvedAssetId,
        assetSymbol: resolvedAssetSymbol
      };

      vault.txs = [tx, ...vault.txs].slice(0, 25);
      saveVault(walletAddress, network, vault);

      await sleep(450);
      const balance = Number(vault.balances[resolvedAssetId] ?? "0") + Number(vault.rewards[resolvedAssetId] ?? "0");
      const completed: VaultTx = { ...tx, status: "success", hash: `SIM-${createId()}` };

      const next: StoredVault = {
        balances: {
          ...vault.balances,
          [resolvedAssetId]: toFixedString(balance)
        },
        rewards: {
          ...vault.rewards,
          [resolvedAssetId]: "0"
        },
        txs: [completed, ...vault.txs.filter((t) => t.id !== tx.id)].slice(0, 25)
      };
      saveVault(walletAddress, network, next);
      return completed;
    }
  };

  return {
    getBalances: withErrorHandling(
      withApiResilience(baseSdk.getBalances, { timeout: 5000, retries: 2 }),
      'getBalances'
    ),
    getTransactions: withErrorHandling(
      withApiResilience(baseSdk.getTransactions, { timeout: 5000, retries: 2 }),
      'getTransactions'
    ),
    deposit: withErrorHandling(
      withApiResilience(baseSdk.deposit, { timeout: 10000, retries: 1 }),
      'deposit'
    ),
    withdraw: withErrorHandling(
      withApiResilience(baseSdk.withdraw, { timeout: 10000, retries: 1 }),
      'withdraw'
    ),
    claimRewards: withErrorHandling(
      withApiResilience(baseSdk.claimRewards, { timeout: 10000, retries: 1 }),
      'claimRewards'
    )
  };
}
