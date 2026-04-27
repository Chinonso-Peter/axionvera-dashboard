import { useMemo, useState } from "react";
import { formatAmount, shortenAddress } from "@/utils/contractHelpers";
import type { VaultTx, VaultTxType, VaultTxStatus } from "@/utils/contractHelpers";
import CopyButton from "./CopyButton";
import { TransactionSkeleton } from "./Skeletons";

// Simple Popover component inline to avoid adding dependencies
function FilterPopover({
  children,
  isOpen,
  onClose
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border-primary bg-background-primary p-4 shadow-lg">
        {children}
      </div>
    </>
  );
}

type TransactionHistoryProps = {
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  transactions: VaultTx[];
  onClaimRewards: () => Promise<void>;
  isClaiming: boolean;
};

type TypeFilter = "all" | VaultTxType;
type StatusFilter = "all" | VaultTxStatus;
type SortKey = "createdAt" | "amount";
type SortDirection = "asc" | "desc";

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
  { value: "claim", label: "Claim" }
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" }
];

function statusStyles(status: VaultTx["status"]) {
  if (status === "success") return "border-emerald-900/50 bg-emerald-950/30 text-emerald-200";
  if (status === "failed") return "border-rose-900/50 bg-rose-950/30 text-rose-200";
  return "border-border-primary bg-background-secondary/30 text-text-primary";
}

function typeLabel(type: VaultTx["type"]) {
  if (type === "deposit") return "Deposit";
  if (type === "withdraw") return "Withdraw";
  return "Claim";
}

function sortIcon(active: boolean, direction: SortDirection) {
  if (!active) return "↕";
  return direction === "asc" ? "↑" : "↓";
}

const selectClassName =
  "rounded-lg border border-border-primary bg-background-secondary/30 px-3 py-1.5 text-xs text-text-primary outline-none transition hover:bg-background-secondary/60 focus:border-axion-500";

export default function TransactionHistory({
  isConnected,
  publicKey,
  isLoading,
  transactions,
  onClaimRewards,
  isClaiming
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;

      const txDate = new Date(tx.createdAt).getTime();

      if (startDate) {
        const startTime = new Date(startDate).setHours(0, 0, 0, 0);
        if (txDate < startTime) return false;
      }

      if (endDate) {
        const endTime = new Date(endDate).setHours(23, 59, 59, 999);
        if (txDate > endTime) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, startDate, endDate]);

  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions];
    sorted.sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "amount") {
        return (Number(a.amount) - Number(b.amount)) * directionFactor;
      }

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (dateA - dateB) * directionFactor;
    });
    return sorted;
  }, [filteredTransactions, sortKey, sortDirection]);

  const hasActiveFilter = typeFilter !== "all" || statusFilter !== "all" || startDate !== "" || endDate !== "";

  const toggleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDirection((previousDirection) => (previousDirection === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("desc");
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-text-primary">Transaction history</div>
          <div className="mt-1 text-xs text-text-muted">
            {isConnected && publicKey ? `Recent vault activity for ${shortenAddress(publicKey, 6)}` : "Connect a wallet to view history."}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Open filter options"
              aria-expanded={isFilterOpen}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                hasActiveFilter
                  ? "bg-axion-500/20 text-axion-400 hover:bg-axion-500/30"
                  : "bg-white/10 text-text-primary hover:bg-white/15"
              }`}
            >
              Filter {hasActiveFilter ? "•" : ""}
            </button>
            <FilterPopover isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
              <div className="space-y-4">
                <div className="border-b border-border-primary pb-3">
                  <h3 className="text-sm font-semibold text-text-primary">Filter Transactions</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="type-filter" className="mb-1.5 block text-xs text-text-muted">Type</label>
                    <select
                      id="type-filter"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                      className={`${selectClassName} w-full`}
                      aria-label="Filter transactions by type"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status-filter" className="mb-1.5 block text-xs text-text-muted">Status</label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      className={`${selectClassName} w-full`}
                      aria-label="Filter transactions by status"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="start-date" className="mb-1.5 block text-xs text-text-muted">Start Date</label>
                      <input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={selectClassName}
                        aria-label="Filter transactions from date"
                      />
                    </div>
                    <div>
                      <label htmlFor="end-date" className="mb-1.5 block text-xs text-text-muted">End Date</label>
                      <input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={selectClassName}
                        aria-label="Filter transactions to date"
                      />
                    </div>
                  </div>
                </div>

                {hasActiveFilter ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    aria-label="Clear all transaction filters"
                    className="w-full rounded-lg border border-border-primary px-3 py-2 text-xs font-medium text-text-secondary transition hover:bg-background-secondary/60 hover:text-text-primary"
                  >
                    Clear Filters
                  </button>
                ) : null}
              </div>
            </FilterPopover>
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
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border-primary" role="table" aria-label="Transaction History">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] gap-3 bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary font-semibold" role="row">
          <div role="columnheader">Type</div>
          <div role="columnheader">Amount</div>
          <div role="columnheader">Created</div>
          <div role="columnheader">Status</div>
        </div>
        <div className="divide-y divide-border-primary" role="rowgroup">
          {isLoading ? (
            <TransactionSkeleton />
          ) : filteredTransactions.length === 0 ? (
            <div className="px-4 py-6 text-sm text-text-secondary" role="row">
              <div role="cell" className="col-span-4">
                {hasActiveFilter ? "No transactions match the selected filters." : "No transactions yet."}
              </div>
            </div>
          ) : (
            sortedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-[1.2fr_1fr_1fr_0.9fr] items-center gap-3 px-4 py-3 text-sm"
                role="row"
              >
                <div className="text-text-primary" role="cell">{typeLabel(tx.type)}</div>
                <div className="text-text-primary" role="cell">{formatAmount(tx.amount)}</div>
                <div className="text-text-muted" role="cell">{new Date(tx.createdAt).toLocaleString()}</div>
                <div role="cell">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusStyles(tx.status)}`}>
                    {tx.status}
                  </span>
                  {tx.hash ? (
                    <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                      <span>Hash: {shortenAddress(tx.hash, 8)}</span>
                      <CopyButton text={tx.hash} label="Copy hash" size="sm" />
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {hasActiveFilter && !isLoading ? (
        <div className="mt-3 text-xs text-text-muted">
          Showing {sortedTransactions.length} of {transactions.length} transactions
        </div>
      ) : null}
    </section>
  );
}
