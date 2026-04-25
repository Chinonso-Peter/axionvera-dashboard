import dynamic from "next/dynamic";
import Head from "next/head";

import BalanceCard from "@/components/BalanceCard";
import DepositForm from "@/components/DepositForm";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { TransactionSkeleton } from "@/components/Skeletons";
import WithdrawForm from "@/components/WithdrawForm";
import { useWalletAssetBalance } from "@/hooks/useWalletAssetBalance";
import { useVault } from "@/hooks/useVault";
import { useWalletContext } from "@/hooks/useWallet";
import { findVaultAsset, getVaultAssets } from "@/utils/vaultAssets";
import { useEffect, useMemo, useState } from "react";

const TransactionHistory = dynamic(
  () => import("@/components/TransactionHistory"),
  {
    loading: () => <TransactionSkeleton />,
    ssr: false,
  }
);

const AnalyticsChart = dynamic(() => import("@/components/AnalyticsChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-2xl border border-border-primary bg-background-primary/30" />
  ),
});

export default function DashboardPage() {
  const wallet = useWalletContext();
  const assets = useMemo(() => getVaultAssets(), []);
  const [selectedAssetId, setSelectedAssetId] = useState(assets[0]?.id ?? "native-xlm");

  useEffect(() => {
    if (!assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(assets[0]?.id ?? "native-xlm");
    }
  }, [assets, selectedAssetId]);

  const selectedAsset = useMemo(() => findVaultAsset(selectedAssetId), [selectedAssetId]);
  const walletAssetBalance = useWalletAssetBalance({
    walletAddress: wallet.publicKey,
    network: wallet.network,
    asset: selectedAsset,
  });
  const vault = useVault({ walletAddress: wallet.publicKey, asset: selectedAsset });

  return (
    <>
      <Head>
        <title>Dashboard · Axionvera</title>
      </Head>
      <main className="min-h-screen bg-background-primary text-text-primary transition-colors duration-200">
        <Sidebar />
        <div className="flex-1 w-full transition-all lg:pl-64">
          <Navbar
            publicKey={wallet.publicKey}
            isConnecting={wallet.isConnecting}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="col-span-1 w-full lg:col-span-1">
                <BalanceCard
                  isConnected={wallet.isConnected}
                  publicKey={wallet.publicKey}
                  balance={vault.balance}
                  rewards={vault.rewards}
                  assetSymbol={selectedAsset.symbol}
                  isLoading={vault.isLoading}
                  error={vault.error}
                  onRefresh={vault.refresh}
                />
              </div>
              <div className="col-span-1 w-full lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <DepositForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    onDeposit={vault.deposit}
                    status={vault.depositStatus}
                    walletBalance={walletAssetBalance.balance}
                    selectedAsset={selectedAsset}
                    assets={assets}
                    onAssetChange={setSelectedAssetId}
                    statusMessage={
                      vault.depositStatus === "pending"
                        ? `Depositing ${vault.lastDepositAmount ?? "0"} ${selectedAsset.symbol} into the vault.`
                        : vault.depositStatus === "success"
                          ? `Successfully deposited ${vault.lastDepositAmount ?? "0"} ${selectedAsset.symbol}.`
                          : vault.depositStatus === "error"
                            ? vault.depositError
                            : null
                    }
                    transactionHash={vault.depositHash}
                  />
                  <WithdrawForm
                    isConnected={wallet.isConnected}
                    isSubmitting={vault.isSubmitting}
                    balance={vault.balance}
                    onWithdraw={vault.withdraw}
                    selectedAsset={selectedAsset}
                    assets={assets}
                    onAssetChange={setSelectedAssetId}
                    status={vault.withdrawStatus}
                    statusMessage={
                      vault.withdrawStatus === "pending"
                        ? `Withdrawing ${vault.lastWithdrawAmount ?? "0"} ${selectedAsset.symbol} from the vault.`
                        : vault.withdrawStatus === "success"
                          ? `Successfully withdrew ${vault.lastWithdrawAmount ?? "0"} ${selectedAsset.symbol}.`
                          : vault.withdrawStatus === "error"
                            ? vault.withdrawError
                            : null
                    }
                    transactionHash={vault.withdrawHash}
                  />
                </div>
                <div className="mt-6">
                  <AnalyticsChart />
                </div>
                <div className="mt-6 w-full overflow-x-auto">
                  <TransactionHistory
                    isConnected={wallet.isConnected}
                    publicKey={wallet.publicKey}
                    isLoading={vault.isLoading}
                    transactions={vault.transactions}
                    onClaimRewards={vault.claimRewards}
                    isClaiming={vault.isClaiming}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
