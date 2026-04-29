import { useEffect, useMemo, useState } from "react";
import {
  formatAmount,
  shortenAddress,
  type VaultTx,
  type VaultTxType,
  type VaultTxStatus,
} from "@/utils/contractHelpers";
import { NETWORK } from "@/utils/networkConfig";
import CopyButton from "./CopyButton";
import { TransactionSkeleton } from "./Skeletons";

const PAGE_SIZE = 10;

type TypeFilter = "all" | VaultTxType;
type StatusFilter = "all" | VaultTxStatus;

const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
  { value: "claim", label: "Claim" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

function statusStyles(status: VaultTxStatus) {
  if (status === "success")
    return "border-emerald-900/50 bg-emerald-950/30 text-emerald-200";
  if (status === "failed")
    return "border-rose-900/50 bg-rose-950/30 text-rose-200";
  return "border-border-primary bg-background-secondary/30 text-text-primary";
}

function typeLabel(type: VaultTxType) {
  if (type === "deposit") return "Deposit";
  if (type === "withdraw") return "Withdraw";
  return "Claim";
}

function getExplorerUrl(hash: string) {
  const networkPath = NETWORK === "mainnet" ? "public" : NETWORK;
  return `https://stellar.expert/explorer/${networkPath}/tx/${hash}`;
}

type Props = {
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  transactions: VaultTx[];
  onClaimRewards: () => Promise<void>;
  isClaiming: boolean;
};

export default function TransactionHistory({
  isConnected,
  publicKey,
  isLoading,
  transactions,
  onClaimRewards,
  isClaiming,
}: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // FILTER
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, statusFilter]);

  // SORT (latest first)
  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [filtered]);

  // PAGINATION
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, currentPage]);

  const hasTransactions = sorted.length > 0;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Transaction History
          </h2>
          <p className="text-xs text-text-muted">
            {isConnected && publicKey
              ? `Recent activity for ${shortenAddress(publicKey, 6)}`
              : "Connect wallet"}
          </p>
        </div>

        <button
          onClick={onClaimRewards}
          disabled={!isConnected || isClaiming}
          className="rounded-xl bg-white/10 px-4 py-2 text-sm"
        >
          {isClaiming ? "Claiming..." : "Claim Rewards"}
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="rounded bg-background-secondary px-2 py-1"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded bg-background-secondary px-2 py-1"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="border rounded-xl overflow-hidden">
        {isLoading ? (
          <TransactionSkeleton />
        ) : !hasTransactions ? (
          <div className="p-6 text-center text-text-muted">
            No transactions yet
          </div>
        ) : (
          currentItems.map((tx) => (
            <div
              key={tx.id}
              className="grid grid-cols-4 gap-3 p-3 border-b"
            >
              <div>{typeLabel(tx.type)}</div>
              <div>{formatAmount(tx.amount)}</div>
              <div className="text-xs">
                {new Date(tx.createdAt).toLocaleString()}
              </div>
              <div>
                <span className={`px-2 py-1 rounded ${statusStyles(tx.status)}`}>
                  {tx.status}
                </span>

                {tx.hash && (
                  <div className="text-xs mt-1 flex gap-1">
                    <a
                      href={getExplorerUrl(tx.hash)}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      view
                    </a>
                    <CopyButton text={tx.hash} label="Copy" size="sm" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION */}
      {hasTransactions && (
        <div className="flex justify-between mt-4 text-xs">
          <span>
            Page {currentPage} / {totalPages}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>

            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}