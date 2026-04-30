import type { StellarNetwork } from "@/utils/networkConfig";
import { withApiResilience, withErrorHandling, ApiCallOptions } from "./apiResilience";
﻿import type { StellarNetwork } from "@/utils/networkConfig";
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
  getBalances: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultBalances>;
  getTransactions: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx[]>;
  deposit: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  withdraw: (args: { walletAddress: string; network: StellarNetwork; amount: string }, options?: ApiCallOptions) => Promise<VaultTx>;
  claimRewards: (args: { walletAddress: string; network: StellarNetwork }, options?: ApiCallOptions) => Promise<VaultTx>;
  simulateTransaction: (args: { walletAddress: string; network: StellarNetwork; type: VaultTxType; amount?: string }, options?: ApiCallOptions) => Promise<TransactionSimulation>;
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
  balance: string;
  rewards: string;
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
  if (typeof window === "undefined") return { balance: "0", rewards: "0", txs: [] };

  const raw = window.localStorage.getItem(getStorageKey(walletAddress, network));
  if (!raw) return { balance: "0", rewards: "0", txs: [] };

  try {
    const parsed = JSON.parse(raw) as StoredVault;
    return {
      balance: typeof parsed.balance === "string" ? parsed.balance : "0",
      rewards: typeof parsed.rewards === "string" ? parsed.rewards : "0",
      txs: Array.isArray(parsed.txs) ? parsed.txs : []
    };
  } catch {
    return { balance: "0", rewards: "0", txs: [] };
  }
}

function saveVault(walletAddress: string, network: StellarNetwork, vault: StoredVault) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(walletAddress, network), JSON.stringify(vault));
}

function toFixedString(n: number) {
  return n.toString();
}

export function createAxionveraVaultSdk(): AxionveraVaultSdk {
  const baseSdk = {
    async getBalances({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const vault = loadVault(walletAddress, network);
      return { balance: vault.balance, rewards: vault.rewards };
    },

    async getTransactions({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const vault = loadVault(walletAddress, network);
      return vault.txs;
    },

    async deposit({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }) {
      const txId = createId();

      // ✅ always reload fresh state
      const vault = loadVault(walletAddress, network);

      const tx: VaultTx = {
        id: txId,
        type: "deposit",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      saveVault(walletAddress, network, {
        ...vault,
        txs: [tx, ...vault.txs].slice(0, 25)
      });

      await sleep(1); // fast for tests

      const fresh = loadVault(walletAddress, network);

      const nextBalance = Number(fresh.balance) + Number(amount);
      const nextRewards = Number(fresh.rewards) + Number(amount) * 0.01;

      const completed: VaultTx = {
        ...tx,
        status: "success",
        hash: `SIM-${createId()}`
      };

      saveVault(walletAddress, network, {
        balance: toFixedString(nextBalance),
        rewards: toFixedString(nextRewards),
        txs: [completed, ...fresh.txs.filter(t => t.id !== txId)].slice(0, 25)
      });

      return completed;
    },

    async withdraw({ walletAddress, network, amount }: { walletAddress: string; network: StellarNetwork; amount: string }) {
      const txId = createId();

      const vault = loadVault(walletAddress, network);

      const tx: VaultTx = {
        id: txId,
        type: "withdraw",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      saveVault(walletAddress, network, {
        ...vault,
        txs: [tx, ...vault.txs].slice(0, 25)
      });

      await sleep(1);

      const fresh = loadVault(walletAddress, network);

      const nextBalance = Math.max(0, Number(fresh.balance) - Number(amount));

      const completed: VaultTx = {
        ...tx,
        status: "success",
        hash: `SIM-${createId()}`
      };

      saveVault(walletAddress, network, {
        balance: toFixedString(nextBalance),
        rewards: fresh.rewards,
        txs: [completed, ...fresh.txs.filter(t => t.id !== txId)].slice(0, 25)
      });

      return completed;
    },

    async claimRewards({ walletAddress, network }: { walletAddress: string; network: StellarNetwork }) {
      const txId = createId();

      const vault = loadVault(walletAddress, network);

      const tx: VaultTx = {
        id: txId,
        type: "claim",
        amount: vault.rewards,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      saveVault(walletAddress, network, {
        ...vault,
        txs: [tx, ...vault.txs].slice(0, 25)
      });

      await sleep(1);

      const fresh = loadVault(walletAddress, network);

      const nextBalance = Number(fresh.balance) + Number(fresh.rewards);

      const completed: VaultTx = {
        ...tx,
        status: "success",
        hash: `SIM-${createId()}`
      };

      saveVault(walletAddress, network, {
        balance: toFixedString(nextBalance),
        rewards: "0",
        txs: [completed, ...fresh.txs.filter(t => t.id !== txId)].slice(0, 25)
      });

      return completed;
    }
  };

  return {
    getBalances: withErrorHandling(withApiResilience(baseSdk.getBalances), "getBalances"),
    getTransactions: withErrorHandling(withApiResilience(baseSdk.getTransactions), "getTransactions"),
    deposit: withErrorHandling(withApiResilience(baseSdk.deposit), "deposit"),
    withdraw: withErrorHandling(withApiResilience(baseSdk.withdraw), "withdraw"),
    claimRewards: withErrorHandling(withApiResilience(baseSdk.claimRewards), "claimRewards")
  };
}
