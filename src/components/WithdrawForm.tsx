import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { createWithdrawSchema, WithdrawFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { formatAmount, shortenAddress } from '@/utils/contractHelpers';
import type { VaultAsset } from '@/utils/vaultAssets';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  balance: string;
  onWithdraw: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  selectedAsset: VaultAsset;
  assets: VaultAsset[];
  onAssetChange: (assetId: string) => void;
};

export default function WithdrawForm({
  isConnected,
  isSubmitting,
  balance,
  onWithdraw,
  status,
  statusMessage,
  transactionHash,
  selectedAsset,
  assets,
  onAssetChange
}: WithdrawFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(createWithdrawSchema(Number.parseFloat(balance) || 0)),
    mode: 'onChange',
    defaultValues: {
      amount: '' as any,
    }
  });

  const numericBalance = Number.parseFloat(balance) || 0;

  function handleMax() {
    if (numericBalance > 0) {
      setValue('amount', numericBalance as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }

  const onSubmit = async (data: WithdrawFormData) => {
    try {
      await onWithdraw(data.amount.toString());
      notify.success("Withdrawal Successful", `You have withdrawn ${data.amount} ${selectedAsset.symbol}.`);
      reset();
    } catch (error) {
      console.error('Withdrawal error:', error);
    }
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Withdraw</div>
      <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>
      <div className="mt-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
        Available balance: <span className="font-medium text-text-primary">{formatAmount(balance)} {selectedAsset.symbol}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="withdraw-asset" className="text-xs font-medium text-text-secondary">
            Asset
          </label>
          <select
            id="withdraw-asset"
            value={selectedAsset.id}
            onChange={(event) => onAssetChange(event.target.value)}
            disabled={assets.length <= 1}
            className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm text-text-primary transition focus:border-axion-500 focus:outline-none focus:ring-2 focus:ring-axion-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Available Balance</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{formatAmount(balance)} {selectedAsset.symbol}</span>
            <button
              type="button"
              onClick={handleMax}
              disabled={!isConnected || numericBalance <= 0}
              className="rounded-md bg-axion-500/10 px-2 py-0.5 text-xs font-semibold text-axion-400 transition hover:bg-axion-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Max
            </button>
          </div>
        </div>

        <FormInput
          {...register('amount')}
          id="withdraw-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          error={errors.amount}
          helperText={`Enter amount between 0.0001 and ${formatAmount(balance)} ${selectedAsset.symbol}`}
        />

        {status !== 'idle' ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === 'success'
                ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                : status === 'error'
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                  : 'border-border-primary bg-background-secondary/30 text-text-primary'
            }`}
          >
            <div className="font-medium">
              {status === 'pending' ? 'Withdrawal transaction pending' : status === 'success' ? 'Withdrawal completed' : 'Withdrawal failed'}
            </div>
            {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
            {transactionHash ? (
              <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={shouldDisableSubmit}
          aria-label={isSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
          className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? `Submitting ${selectedAsset.symbol}...` : "Withdraw"}
        </button>
      </form>
    </section>
  );
}
