import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DepositForm from "@/components/DepositForm";

describe("DepositForm", () => {
  test("submits amount", async () => {
    const user = userEvent.setup();
    const onDeposit = jest.fn(async () => undefined);

    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={onDeposit}
        status="idle"
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");
    await waitFor(() => expect(screen.getByRole("button", { name: /deposit/i })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: /deposit/i }));

    await waitFor(() => expect(onDeposit).toHaveBeenCalledWith("12.5"));
  });

  test("shows TransactionStepper when status=pending and txStep is set", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={true}
        onDeposit={jest.fn(async () => undefined)}
        status="pending"
        txStep="submitted"
      />
    );

    expect(screen.getByRole("list", { name: /transaction progress/i })).toBeInTheDocument();
    expect(screen.getByText("Submitted to Network")).toBeInTheDocument();
  });

  test("renders success feedback", () => {
    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={jest.fn(async () => undefined)}
        status="success"
        transactionHash="SIM-1234567890ABCDEF"
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(/deposit completed/i);
    expect(screen.getByText(/tx:/i)).toBeInTheDocument();
  });

  test("disables deposit button when network is mismatched", async () => {
    const user = userEvent.setup();
    const onDeposit = jest.fn(async () => undefined);

    render(
      <DepositForm
        isConnected={true}
        isSubmitting={false}
        onDeposit={onDeposit}
        status="idle"
        isNetworkMismatch={true}
      />
    );

    await user.type(screen.getByLabelText(/amount/i), "12.5");
    await waitFor(() => expect(screen.getByRole("button", { name: /deposit/i })).toBeDisabled());
  });
});

