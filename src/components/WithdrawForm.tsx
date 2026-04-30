import { useState, useEffect } from 'react';
import { FormInput } from './FormInput';
import TransactionSuccess from './TransactionSuccess';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useState } from 'react';
import { FormInput } from './FormInput';
import { TransactionStepper } from './TransactionStepper';
import { useFormValidation } from '@/hooks/useFormValidation';
import { createWithdrawSchema } from '@/utils/validation';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import { createWithdrawSchema, WithdrawFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { formatBalance, truncateAddress } from '@/utils/formatters';
import { formatAmount, shortenAddress } from '@/utils/contractHelpers';
import { useState } from 'react';
import ConfirmTransactionModal from '@/components/modals/ConfirmTransactionModal';
import { formatAmount, shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';
import type { TxStep } from '@/utils/pollTransaction';
import { FormSkeleton } from './Skeletons';

type WithdrawFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  isLoading?: boolean;
  balance: string;
  onWithdraw: (amount: string) => Promise<void>;
  status: 'idle' | 'pending' | 'success' | 'error';
  txStep?: TxStep | null;
  statusMessage?: string | null;
  transactionHash?: string | null;
  onSimulate?: (amount: string) => Promise<TransactionSimulation>;
  isNetworkMismatch?: boolean;
};

export default function WithdrawForm({
  isConnected,
  isSubmitting,
  isLoading,
  balance,
  onWithdraw,
  status,
  txStep,
  statusMessage,
  transactionHash,
  onSimulate,
  isNetworkMismatch,
  defaultAmount = ""
  onSimulate
}: WithdrawFormProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<TransactionSimulation | null>(null);
  const [pendingAmount, setPendingAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  const numericBalance = parseFloat(balance);
  const schema = createWithdrawSchema(numericBalance > 0 ? numericBalance : 10000);

  const numericBalance = parseFloat(balance);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(createWithdrawSchema(numericBalance)),
    mode: 'onChange',
    defaultValues: {
      amount: '' as unknown as number,
    },
  });

  // Set default amount from props when component mounts and wallet is connected
  useEffect(() => {
    if (defaultAmount && isConnected) {
      setValue('amount', defaultAmount as any, { shouldValidate: true, shouldDirty: true });
    }
  }, [defaultAmount, isConnected, setValue]);
  if (isLoading) return <FormSkeleton />;

  const executeWithdraw = async (amount: string) => {
    try {
      await onWithdraw(data.amount.toString());
      notify.success('Withdrawal Successful', `You have withdrawn ${data.amount} tokens.`);
      await onWithdraw(amount);
      notify.success("Withdrawal Successful", `You have withdrawn ${amount} tokens.`);
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
      setIsModalOpen(false);
    }
  };

  const handleFormSubmit = async (data: WithdrawFormData) => {
  const { values, errors, shouldDisableSubmit, updateField, handleBlur, handleSubmit, reset, setValue } =
    useFormValidation({
      schema,
      initialValues: { amount: '' },
    });

  const executeWithdraw = async (amount: string) => {
    try {
      await onWithdraw(amount);
      reset();
      setIsModalOpen(false);
    } catch {
      setIsModalOpen(false);
    }
  };

  const onSubmit = async () => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return;

    const amountStr = values.amount.toString();

  const onSubmit = async (data: WithdrawFormData) => {
    setPendingAmount(data.amount.toString());
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingAmount) return;

    try {
      await onWithdraw(pendingAmount);
      notify.success("Withdrawal Successful", `You have withdrawn ${pendingAmount} tokens.`);
    const amountStr = data.amount.toString();
    setWithdrawAmount(amountStr);
    if (onSimulate) {
      setPendingAmount(amountStr);
      setIsModalOpen(true);
      setSimulationData(null);
      setIsSimulating(true);
      try {
        const sim = await onSimulate(amountStr);
        setSimulationData(sim);
      } catch {
        setIsModalOpen(false);
        notify.error('Simulation Failed', 'Could not simulate transaction.');
      } finally {
        setIsSimulating(false);
      }
    } else {
      await executeWithdraw(amountStr);
    }
  };

  const {
    isDirty,
    isSubmitting: isFormSubmitting,
    isValid,
    getFieldProps,
    reset,
    handleSubmit,
    updateField,
  } = useFormValidation({
    schema: createWithdrawSchema(numericBalance),
    initialValues: { amount: 0 },
    onSubmit: handleFormSubmit,
  });

  function handleMax() {
    if (numericBalance > 0) {
      updateField('amount', numericBalance);
    }
  }

  // Show success modal when status changes to success and we have a hash
  useEffect(() => {
    if (status === 'success' && transactionHash) {
      setIsModalOpen(true);
      notify.success("Withdrawal Successful", `You have withdrawn ${withdrawAmount} tokens.`);
    }
  }, [status, transactionHash, withdrawAmount]);
    }
  };

  const handleMax = () => {
    if (numericBalance > 0) {
      updateField('amount', numericBalance.toString());
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSimulationData(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid() || !isDirty || isFormSubmitting || isSimulating;
  const amountProps = getFieldProps('amount');
  const isDisabled = !isConnected || shouldDisableSubmit() || isSubmitting || isSimulating;

  return (
    <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
      <div className="text-sm font-semibold text-text-primary">Withdraw</div>
      <div className="mt-1 text-xs text-text-muted">Withdraw tokens from the Axionvera vault.</div>
      <div className="mt-3 rounded-xl border border-border-primary bg-background-secondary/20 px-4 py-3 text-xs text-text-secondary">
        Available balance:{' '}
        <span className="font-medium text-text-primary">{formatBalance(balance)}</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
          onSubmit();
        }}
        className="mt-5 space-y-4"
      >
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Available Balance:</span>
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
          {...amountProps}
          id="withdraw-amount"
          inputMode="decimal"
          placeholder="0.0"
          label="Amount"
          required
          value={values.amount}
          onChange={(v) => updateField('amount', v)}
          onBlur={() => handleBlur('amount')}
          error={errors.amount}
          helperText={`Enter amount between 0.0001 and ${formatBalance(balance)}`}
        />

        {txStep && status === 'pending' ? (
          <div role="status" aria-live="polite" className="pt-1">
            <TransactionStepper txStep={txStep} />
          </div>
        ) : status !== 'idle' && status !== 'success' ? (
      executeWithdraw(amountStr);
    }
  };

  const executeWithdraw = async (amount: string) => {
    try {
      await onWithdraw(amount);
      notify.success("Withdrawal Successful", `You have withdrawn ${amount} tokens.`);
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Withdrawal error:', error);
    } finally {
      setIsModalOpen(false);
      setPendingAmount(null);
      setIsModalOpen(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setPendingAmount(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting;
  const handleConfirm = () => {
    if (pendingAmount) {
      executeWithdraw(pendingAmount);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSimulationData(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting || isSimulating || !!isNetworkMismatch;

  return (
    <>
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
              status === 'error'
                ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                : status === 'success'
                ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
                : 'border-border-primary bg-background-secondary/30 text-text-primary'
            }`}
          >
            <div className="font-medium">
              {status === 'pending'
                ? 'Withdrawal transaction pending'
                : status === 'success'
                  ? 'Withdrawal completed'
                  : 'Withdrawal failed'}
              {status === 'pending' ? 'Confirming Transaction...' : 'Withdrawal failed'}
            </div>
            {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
            {transactionHash && status === 'error' ? (
              <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
            ) : null}
          </div>
        ) : status === 'success' && transactionHash ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-axion-500/30 bg-axion-500/10 px-4 py-3 text-sm text-axion-300"
          >
            <div className="font-medium">Withdrawal completed</div>
            <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isDisabled}
          aria-label={isSubmitting ? 'Submitting withdrawal' : 'Withdraw tokens'}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Withdrawing...
            </>
          ) : (
            'Withdraw'
          )}
        </button>
      </form>

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSimulationData(null); }}
        onConfirm={() => { if (pendingAmount) executeWithdraw(pendingAmount); }}
              {status === 'pending' ? 'Withdrawal transaction pending' : status === 'success' ? 'Withdrawal completed' : 'Withdrawal failed'}
            className={`rounded-xl border px-4 py-3 text-sm ${status === 'success'
              ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200'
              : status === 'error'
                ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                : 'border-border-primary bg-background-secondary/30 text-text-primary'
              }`}
          >
            <div className="font-medium">
              {status === 'pending' ? 'Withdrawal transaction pending' : status === 'success' ? 'Withdrawal completed' : 'Withdrawal failed'}
          {status !== 'idle' && status !== 'success' ? (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                status === 'error'
                  ? 'border-rose-900/50 bg-rose-950/30 text-rose-200'
                  : 'border-border-primary bg-background-secondary/30 text-text-primary'
              }`}
            >
              <div className="font-medium">
                {status === 'pending' ? 'Withdrawal transaction pending' : 'Withdrawal failed'}
              </div>
              {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
              {transactionHash && status === 'error' ? (
                <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
              ) : null}
            </div>
            {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
            {transactionHash ? (
              <div className="mt-1 text-xs opacity-80">
                Tx: {truncateAddress(transactionHash, 8, 8)}
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={shouldDisableSubmit}
          aria-label={isSubmitting ? 'Submitting withdrawal' : 'Withdraw tokens'}
          className="w-full rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Withdraw'}
          disabled={shouldDisableSubmit || isFormSubmitting}
          aria-label={isFormSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-primary bg-background-secondary/30 px-4 py-3 text-sm font-medium text-text-primary transition hover:bg-background-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFormSubmitting ? (
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
          <button
            type="submit"
            disabled={shouldDisableSubmit}
            aria-label={isSubmitting ? "Submitting withdrawal" : "Withdraw tokens"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
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

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        actionType="Withdraw"
        assetAmount={pendingAmount || "0"}
        networkFee="~0.00001 XLM" // replace later with real fee
        contractId="CDLZ...XYZ"   // replace with actual contract ID
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        action="withdraw"
        amount={pendingAmount}
        simulation={simulationData}
        isConfirming={isSubmitting}
      />
    </>
  );
}

