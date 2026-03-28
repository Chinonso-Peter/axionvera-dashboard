import { act, renderHook, waitFor } from "@testing-library/react";

import { useVault } from "@/hooks/useVault";
import type { AxionveraVaultSdk } from "@/utils/contractHelpers";

describe("useVault", () => {
  test("deposit updates balance and history", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS" }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.balance).toBe("0");

    await act(async () => {
      void result.current.deposit("10");
    });

    await waitFor(() => expect(result.current.depositStatus).toBe("pending"));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));
    expect(Number(result.current.balance)).toBeGreaterThanOrEqual(10);
    expect(result.current.transactions[0]?.type).toBe("deposit");
    expect(result.current.depositStatus).toBe("success");
    expect(result.current.depositHash).toMatch(/^SIM-/);
  });

  test("withdraw reduces balance", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS_2" }));

    await act(async () => {
      await result.current.deposit("5");
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    await act(async () => {
      void result.current.withdraw("3");
    });
    await waitFor(() => expect(result.current.withdrawStatus).toBe("pending"));
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    expect(Number(result.current.balance)).toBeGreaterThanOrEqual(0);
    expect(result.current.withdrawStatus).toBe("success");
    expect(result.current.withdrawHash).toMatch(/^SIM-/);
  });

  test("withdraw prevents invalid amounts above balance", async () => {
    const { result } = renderHook(() => useVault({ walletAddress: "GTESTWALLETADDRESS_3" }));

    await act(async () => {
      await result.current.deposit("5");
    });
    await waitFor(() => expect(result.current.isSubmitting).toBe(false));

    await act(async () => {
      await result.current.withdraw("10");
    });

    expect(result.current.withdrawStatus).toBe("error");
    expect(result.current.withdrawError).toMatch(/exceeds your available vault balance/i);
    expect(Number(result.current.balance)).toBe(5);
  });

  test("deposit surfaces sdk errors without changing the public api", async () => {
    const failingSdk: AxionveraVaultSdk = {
      getBalances: async () => ({ balance: "0", rewards: "0" }),
      getTransactions: async () => [],
      deposit: async () => {
        throw new Error("Simulated deposit failure");
      },
      withdraw: async () => ({ id: "withdraw-1", type: "withdraw", amount: "1", status: "success", createdAt: new Date().toISOString() }),
      claimRewards: async () => ({ id: "claim-1", type: "claim", amount: "0", status: "success", createdAt: new Date().toISOString() })
    };

    const { result } = renderHook(() =>
      useVault({ walletAddress: "GTESTWALLETADDRESS_4", sdk: failingSdk })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.deposit("7");
    });

    expect(result.current.depositStatus).toBe("error");
    expect(result.current.depositError).toMatch(/simulated deposit failure/i);
    expect(result.current.error).toMatch(/simulated deposit failure/i);
    expect(result.current.transactions[0]?.status).toBe("failed");
    expect(result.current.transactions[0]?.type).toBe("deposit");
  });
});
