import { useEffect, useMemo, useState } from "react";

import { formatAmount, shortenAddress } from "@/utils/contractHelpers";
import type { VaultTx } from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";

type TransactionHistoryProps = {
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  transactions: VaultTx[];
  onClaimRewards: () => Promise<void>;
  isClaiming: boolean;
};

const PAGE_SIZE = 10;

function getActionLabel(type: VaultTx["type"]) {
  if (type === "deposit") return "Deposit";
  if (type === "withdraw") return "Withdraw";
  return "Claim";
}

function getExplorerUrl(hash: string) {
  const networkPath = NETWORK === "mainnet" ? "public" : NETWORK;
  return `https://stellar.expert/explorer/${networkPath}/tx/${hash}`;
}

export default function TransactionHistory({
  isConnected,
  publicKey,
  isLoading,
  transactions,
  onClaimRewards,
  isClaiming
}: TransactionHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [transactions]
  );

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedTransactions.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedTransactions]);

  const hasTransactions = sortedTransactions.length > 0;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Transaction History</h2>
          <p className="mt-1 text-xs text-text-muted">
            {isConnected && publicKey
              ? `Recent vault activity for ${shortenAddress(publicKey, 6)}`
              : "Connect a wallet to view history."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClaimRewards}
          disabled={!isConnected || isClaiming}
          aria-label={isClaiming ? "Claiming rewards" : "Claim your earned rewards"}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isClaiming ? "Claiming..." : "Claim Rewards"}
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-border-primary">
        <table className="min-w-full divide-y divide-border-primary" aria-label="Transaction history table">
          <thead className="bg-background-secondary/20 text-xs text-text-secondary">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Date</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Action</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Amount</th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">Transaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-primary text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-text-muted">Loading transactions…</td>
              </tr>
            ) : !hasTransactions ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center">
                  <div className="mx-auto mb-2 text-4xl" aria-hidden>
                    📭
                  </div>
                  <p className="text-text-primary">No transactions yet</p>
                  <p className="mt-1 text-xs text-text-muted">Your deposits, withdrawals, and claims will appear here.</p>
                </td>
              </tr>
            ) : (
              currentItems.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 text-text-muted">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-primary">{getActionLabel(transaction.type)}</td>
                  <td className="px-4 py-3 text-right text-text-primary">{formatAmount(transaction.amount)}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {transaction.hash ? (
                      <a
                        href={getExplorerUrl(transaction.hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-axion-400 underline-offset-2 transition hover:text-axion-300 hover:underline"
                      >
                        View on Stellar Expert ({shortenAddress(transaction.hash, 8)})
                      </a>
                    ) : (
                      "Pending"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasTransactions && !isLoading ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedTransactions.length)} of{" "}
            {sortedTransactions.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-border-primary px-3 py-1.5 text-xs text-text-primary transition hover:bg-background-secondary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs text-text-muted">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-border-primary px-3 py-1.5 text-xs text-text-primary transition hover:bg-background-secondary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
