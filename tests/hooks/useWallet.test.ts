import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";

import { useWallet } from "@/hooks/useWallet";

jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn(async () => true),
  isAllowed: jest.fn(async () => true),
  setAllowed: jest.fn(async () => undefined),
  getPublicKey: jest.fn(async () => "GCONNECTEDPUBLICKEY")
}));

describe("useWallet", () => {
  function wrapper({ children }: { children: ReactNode }) {
    try {
      const walletContextModule = require("@/contexts/WalletContext") as {
        WalletProvider?: ({ children }: { children: ReactNode }) => JSX.Element;
      };

      if (walletContextModule.WalletProvider) {
        const WalletProvider = walletContextModule.WalletProvider;
        return React.createElement(WalletProvider, null, children);
      }
    } catch {
      // Some branches expose useWallet directly without a provider-backed context.
    }

    return React.createElement(React.Fragment, null, children);
  }

  test("connect sets address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBe("GCONNECTEDPUBLICKEY");
    expect(result.current.isConnected).toBe(true);
  });

  test("disconnect clears address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.isConnected).toBe(false);
  });
});
