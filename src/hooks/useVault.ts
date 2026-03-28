import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/utils/notifications";

import { createAxionveraVaultSdk, parsePositiveAmount } from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";
import type { VaultTx } from "@/utils/contractHelpers";

type UseVaultArgs = {
  walletAddress: string | null;
};

type VaultState = {
  balance: string;
  rewards: string;
  transactions: VaultTx[];
  isLoading: boolean;
  isSubmitting: boolean;
  isClaiming: boolean;
  error: string | null;
  depositStatus: "idle" | "pending" | "success" | "error";
  depositHash: string | null;
  lastDepositAmount: string | null;
  depositError: string | null;
  withdrawStatus: "idle" | "pending" | "success" | "error";
  withdrawHash: string | null;
  lastWithdrawAmount: string | null;
  withdrawError: string | null;
};

export function useVault({ walletAddress }: UseVaultArgs) {
  const sdk = useMemo(() => createAxionveraVaultSdk(), []);
  const [state, setState] = useState<VaultState>({
    balance: "0",
    rewards: "0",
    transactions: [],
    isLoading: false,
    isSubmitting: false,
    isClaiming: false,
    error: null,
    depositStatus: "idle",
    depositHash: null,
    lastDepositAmount: null,
    depositError: null,
    withdrawStatus: "idle",
    withdrawHash: null,
    lastWithdrawAmount: null,
    withdrawError: null
  });

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setState((s) => ({ ...s, balance: "0", rewards: "0", transactions: [], error: null }));
      return;
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [balances, txs] = await Promise.all([
        sdk.getBalances({ walletAddress, network: NETWORK }),
        sdk.getTransactions({ walletAddress, network: NETWORK })
      ]);
      setState((s) => ({
        ...s,
        balance: balances.balance,
        rewards: balances.rewards,
        transactions: txs,
        isLoading: false
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load vault state.";
      notify.error("Vault Update Failed", message);
      setState((s) => ({ ...s, isLoading: false, error: message }));
    }
  }, [sdk, walletAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deposit = useCallback(
    async (amountInput: string) => {
      const amount = parsePositiveAmount(amountInput);
      if (!walletAddress) {
        setState((s) => ({
          ...s,
          error: "Connect a wallet to deposit.",
          depositStatus: "error",
          depositError: "Connect a wallet to deposit.",
          depositHash: null
        }));
        return;
      }
      if (!amount) {
        setState((s) => ({
          ...s,
          error: "Enter a valid amount greater than zero.",
          depositStatus: "error",
          depositError: "Enter a valid amount greater than zero.",
          depositHash: null
        }));
        return;
      }

      const pendingTx: VaultTx = {
        id: `pending-${Date.now()}`,
        type: "deposit",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      setState((s) => ({
        ...s,
        isSubmitting: true,
        error: null,
        depositStatus: "pending",
        depositHash: null,
        depositError: null,
        lastDepositAmount: amount,
        transactions: [pendingTx, ...s.transactions.filter((tx) => tx.id !== pendingTx.id)].slice(0, 25)
      }));
      try {
        const tx = await sdk.deposit({ walletAddress, network: NETWORK, amount });
        await refresh();
        setState((s) => ({
          ...s,
          depositStatus: "success",
          depositHash: tx.hash ?? null,
          depositError: null,
          lastDepositAmount: amount
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Deposit failed.";
        notify.error("Deposit Failed", message);
        setState((s) => ({
          ...s,
          error: message,
          depositStatus: "error",
          depositError: message,
          depositHash: null,
          lastDepositAmount: amount,
          transactions: [
            { ...pendingTx, status: "failed" as const },
            ...s.transactions.filter((tx) => tx.id !== pendingTx.id)
          ].slice(0, 25)
        }));
      } finally {
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [refresh, sdk, walletAddress]
  );

  const withdraw = useCallback(
    async (amountInput: string) => {
      const amount = parsePositiveAmount(amountInput);
      if (!walletAddress) {
        setState((s) => ({
          ...s,
          error: "Connect a wallet to withdraw.",
          withdrawStatus: "error",
          withdrawError: "Connect a wallet to withdraw.",
          withdrawHash: null
        }));
        return;
      }
      if (!amount) {
        setState((s) => ({
          ...s,
          error: "Enter a valid amount greater than zero.",
          withdrawStatus: "error",
          withdrawError: "Enter a valid amount greater than zero.",
          withdrawHash: null
        }));
        return;
      }
      if (Number(amount) > Number(state.balance)) {
        setState((s) => ({
          ...s,
          error: "Withdrawal amount exceeds your available vault balance.",
          withdrawStatus: "error",
          withdrawError: "Withdrawal amount exceeds your available vault balance.",
          withdrawHash: null,
          lastWithdrawAmount: amount
        }));
        return;
      }

      const pendingTx: VaultTx = {
        id: `pending-${Date.now()}`,
        type: "withdraw",
        amount,
        status: "pending",
        createdAt: new Date().toISOString()
      };

      setState((s) => ({
        ...s,
        isSubmitting: true,
        error: null,
        withdrawStatus: "pending",
        withdrawHash: null,
        withdrawError: null,
        lastWithdrawAmount: amount,
        transactions: [pendingTx, ...s.transactions.filter((tx) => tx.id !== pendingTx.id)].slice(0, 25)
      }));
      try {
        const tx = await sdk.withdraw({ walletAddress, network: NETWORK, amount });
        await refresh();
        setState((s) => ({
          ...s,
          withdrawStatus: "success",
          withdrawHash: tx.hash ?? null,
          withdrawError: null,
          lastWithdrawAmount: amount
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Withdraw failed.";
        notify.error("Withdrawal Failed", message);
        setState((s) => ({
          ...s,
          error: message,
          withdrawStatus: "error",
          withdrawError: message,
          withdrawHash: null,
          lastWithdrawAmount: amount,
          transactions: [
            { ...pendingTx, status: "failed" as const },
            ...s.transactions.filter((tx) => tx.id !== pendingTx.id)
          ].slice(0, 25)
        }));
      } finally {
        setState((s) => ({ ...s, isSubmitting: false }));
      }
    },
    [refresh, sdk, state.balance, walletAddress]
  );

  const claimRewards = useCallback(async () => {
    if (!walletAddress) {
      setState((s) => ({ ...s, error: "Connect a wallet to claim rewards." }));
      return;
    }

    setState((s) => ({ ...s, isClaiming: true, error: null }));
    try {
      await sdk.claimRewards({ walletAddress, network: NETWORK });
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Claim failed.";
      notify.error("Claim Failed", message);
      setState((s) => ({ ...s, error: message }));
    } finally {
      setState((s) => ({ ...s, isClaiming: false }));
    }
  }, [refresh, sdk, walletAddress]);

  return {
    balance: state.balance,
    rewards: state.rewards,
    transactions: state.transactions,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    isClaiming: state.isClaiming,
    error: state.error,
    depositStatus: state.depositStatus,
    depositHash: state.depositHash,
    lastDepositAmount: state.lastDepositAmount,
    depositError: state.depositError,
    withdrawStatus: state.withdrawStatus,
    withdrawHash: state.withdrawHash,
    lastWithdrawAmount: state.lastWithdrawAmount,
    withdrawError: state.withdrawError,
    refresh,
    deposit,
    withdraw,
    claimRewards
  };
}
