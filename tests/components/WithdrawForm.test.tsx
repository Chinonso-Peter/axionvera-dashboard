import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import WithdrawForm from "@/components/WithdrawForm";

describe("WithdrawForm", () => {
  test("submits amount", async () => {
    const user = userEvent.setup();
    const onWithdraw = jest.fn(async () => undefined);

    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={onWithdraw}
        status="idle"
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");
    await waitFor(() => expect(screen.getByRole("button", { name: /withdraw/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /withdraw/i }));

    await waitFor(() => expect(onWithdraw).toHaveBeenCalledWith("12.5"));
  });

  test("renders transaction feedback and balance", () => {
    render(
      <WithdrawForm
        isConnected={true}
        isSubmitting={false}
        balance="50"
        onWithdraw={jest.fn(async () => undefined)}
        status="success"
        statusMessage="Successfully withdrew 12.5 tokens."
        transactionHash="SIM-1234567890ABCDEF"
      />
    );

    expect(screen.getByText(/available balance:/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/withdrawal completed/i);
    expect(screen.getByText(/successfully withdrew 12.5 tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });
});
