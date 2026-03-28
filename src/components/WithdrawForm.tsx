import { FormInput } from './FormInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { withdrawSchema, WithdrawFormData } from '@/utils/validation';
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
  const initialValues: WithdrawFormData = {
    amount: '',
  };

  const {
    getFieldProps,
    shouldDisableSubmit,
    handleSubmit,
    reset,
  } = useFormValidation({
    schema: withdrawSchema,
    initialValues,
    onSubmit: async (data) => {
      await onWithdraw(data.amount);
      notify.success("Withdrawal Successful", `You have withdrawn ${data.amount} tokens.`);
      reset();
    },
  });

  const amountProps = getFieldProps('amount');

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Withdraw</div>
      <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>
      <div className="mt-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
        Available balance: <span className="font-medium text-text-primary">{formatAmount(balance)}</span>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">
        <FormInput
          {...amountProps}
          id="withdraw-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          helperText="Enter amount between 0.0001 and 10,000"
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
          disabled={!isConnected || shouldDisableSubmit() || isSubmitting}
          aria-label={isSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
          className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Withdraw"}
        </button>
      </form>
    </section>
  );
}
