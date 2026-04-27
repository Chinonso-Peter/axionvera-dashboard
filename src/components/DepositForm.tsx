import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput } from './FormInput';
import TransactionSuccess from './TransactionSuccess';
import { useFormValidation } from '@/hooks/useFormValidation';
import { depositSchema, DepositFormData } from '@/utils/validation';
import { notify } from '@/utils/notifications';
import { shortenAddress, type TransactionSimulation } from '@/utils/contractHelpers';
import { ConfirmTransactionModal } from './ConfirmTransactionModal';
import { AppTooltip } from './AppTooltip';
import { GLOSSARY } from '@/utils/glossary';

type DepositFormProps = {
  isConnected: boolean;
  isSubmitting: boolean;
  onDeposit: (amount: string) => Promise<void>;
  status: "idle" | "pending" | "success" | "error";
  statusMessage?: string | null;
  transactionHash?: string | null;
  walletBalance?: number | null;
  onSimulate?: (amount: string) => Promise<TransactionSimulation>;
};

const NETWORK_FEE_RESERVE = 0.1;

export default function DepositForm({
  isConnected,
  isSubmitting,
  onDeposit,
  status,
  statusMessage,
  transactionHash,
  walletBalance,
  onSimulate,
}: DepositFormProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<TransactionSimulation | null>(null);
  const [pendingAmount, setPendingAmount] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
  } = useFormValidation({
    schema: depositSchema,
    initialValues,
    onSubmit: async (data) => {
      setDepositAmount(data.amount);
      await onDeposit(data.amount);
    },
  });

  // Show success modal when status changes to success and we have a hash
  useEffect(() => {
    if (status === 'success' && transactionHash) {
      setShowSuccessModal(true);
      notify.success("Deposit Successful", `You have deposited ${depositAmount} tokens.`);
    }
  }, [status, transactionHash, depositAmount]);

  const onSubmit = async (data: DepositFormData) => {
    const amountStr = data.amount.toString();
    if (onSimulate) {
      setPendingAmount(amountStr);
      setIsModalOpen(true);
      setSimulationData(null);
      setIsSimulating(true);
      try {
        const sim = await onSimulate(amountStr);
        setSimulationData(sim);
      } catch (error) {
        console.error('Simulation error:', error);
        setIsModalOpen(false);
        notify.error("Simulation Failed", "Could not simulate transaction.");
      } finally {
        setIsSimulating(false);
      }
    } else {
      executeDeposit(amountStr);
    }
  };

  const executeDeposit = async (amount: string) => {
    try {
      await onDeposit(amount);
      notify.success("Deposit Successful", `You have deposited ${amount} tokens.`);
      reset();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Deposit error:', error);
      setIsModalOpen(false);
    }
  };

  const handleConfirm = () => {
    if (pendingAmount) {
      executeDeposit(pendingAmount);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSimulationData(null);
  };

  const shouldDisableSubmit = !isConnected || !isValid || !isDirty || isSubmitting || isSimulating;

  return (
    <>
      <section className="rounded-2xl border border-border-primary bg-background-primary/30 p-6">
        <div className="text-sm font-semibold text-text-primary">Deposit</div>
        <div className="mt-1 text-xs text-text-muted">Deposit tokens into the Axionvera vault.</div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="mt-5 space-y-4">
          <FormInput
            {...amountProps}
            id="deposit-amount"
            inputMode="decimal"
            placeholder="0.0"
            label="Amount"
            required
            helperText="Enter amount between 0.0001 and 10,000"
          />

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
                {status === 'pending' ? 'Deposit transaction pending' : 'Deposit failed'}
              </div>
              {statusMessage ? <div className="mt-1 text-xs opacity-90">{statusMessage}</div> : null}
              {transactionHash && status === 'error' ? (
                <div className="mt-1 text-xs opacity-80">Tx: {shortenAddress(transactionHash, 8)}</div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!isConnected || shouldDisableSubmit() || isSubmitting}
            aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
            className="w-full rounded-xl bg-axion-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-axion-500/20 transition hover:bg-axion-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Deposit"}
          </button>
        </form>
      </section>

        <button
          type="submit"
          disabled={shouldDisableSubmit}
          aria-label={isSubmitting ? "Submitting deposit" : "Deposit tokens"}
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
              Depositing...
            </>
          ) : (
            "Deposit"
          )}
        </button>
      </form>

      <ConfirmTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        action="deposit"
        amount={pendingAmount}
        simulation={simulationData}
        isConfirming={isSubmitting}
      />
    </section>
  );
}