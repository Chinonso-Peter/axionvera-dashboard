import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { createWithdrawSchema, WithdrawFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { formatAmount, shortenAddress } from '@/utils/contractHelpers';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  balance: string;
  onWithdraw: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
};

export default function WithdrawForm({
  isConnected,
  isSubmitting,
  balance,
  onWithdraw,
  status,
  statusMessage,
  transactionHash
}: WithdrawFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(createWithdrawSchema(parseFloat(balance))),
    mode: 'onChange',
    defaultValues: {
      amount: '' as any,
    }
  });

  const numericBalance = parseFloat(balance);

  function handleMax() {
    if (numericBalance > 0) {
      setValue('amount', numericBalance as any, { shouldValidate: true, shouldDirty: true });
    }
  }

  const onSubmit = async (data: WithdrawFormData) => {
    try {
      await onWithdraw(data.amount.toString());
      notify.success("Withdrawal Successful", `You have withdrawn ${data.amount} tokens.`);
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
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Available Balance</span>
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">{formatAmount(balance)}</span>
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
          helperText={`Enter amount between 0.0001 and ${formatAmount(balance)}`}
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Withdrawing...
            </>
          ) : (
            "Withdraw"
          )}
        </button>
      </form>
    </section>
  );
}
