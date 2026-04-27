import React, { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

import * as freighterApi from "@stellar/freighter-api";
import { useWallet } from "@/hooks/useWallet";

jest.mock("@stellar/freighter-api", () => ({
  isConnected: jest.fn(async () => true),
  isAllowed: jest.fn(async () => true),
  setAllowed: jest.fn(async () => undefined),
  getPublicKey: jest.fn(async () => "GCONNECTEDPUBLICKEY"),
  getNetwork: jest.fn(async () => "TESTNET"),
}));

describe("useWallet", () => {
  const mockedFreighter = freighterApi as jest.Mocked<typeof freighterApi>;

  function wrapper({ children }: { children: ReactNode }) {
    const { WalletProvider } = require("@/contexts/WalletContext") as {
      WalletProvider: ({ children }: { children: ReactNode }) => JSX.Element;
    };

    return React.createElement(WalletProvider, null, children);
  }

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockedFreighter.isConnected.mockResolvedValue(true);
    mockedFreighter.isAllowed.mockResolvedValue(true);
    mockedFreighter.getPublicKey.mockResolvedValue("GCONNECTEDPUBLICKEY");
    mockedFreighter.getNetwork.mockResolvedValue("TESTNET");
  });

  test("connect defaults to freighter and sets address", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBe("GCONNECTEDPUBLICKEY");
    expect(result.current.isConnected).toBe(true);
    expect(localStorage.getItem("axionvera:wallet:was_connected")).toBe("true");
    expect(localStorage.getItem("axionvera:wallet:last_type")).toBe("freighter");
  });

  test("disconnect clears persisted wallet flags", async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connect();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.isConnected).toBe(false);
    expect(localStorage.getItem("axionvera:wallet:was_connected")).toBeNull();
    expect(localStorage.getItem("axionvera:wallet:last_type")).toBeNull();
  });

  test("does not attempt silent reconnect without persisted flag", () => {
    renderHook(() => useWallet(), { wrapper });

    expect(mockedFreighter.isAllowed).not.toHaveBeenCalled();
    expect(mockedFreighter.getPublicKey).not.toHaveBeenCalled();
  });

  test("silently reconnects when persisted freighter session is present", async () => {
    localStorage.setItem("axionvera:wallet:was_connected", "true");
    localStorage.setItem("axionvera:wallet:last_type", "freighter");

    const { result } = renderHook(() => useWallet(), { wrapper });

    await waitFor(() => {
      expect(result.current.address).toBe("GCONNECTEDPUBLICKEY");
    });

    expect(mockedFreighter.isAllowed).toHaveBeenCalledTimes(1);
    expect(result.current.walletType).toBe("freighter");
  });
});
