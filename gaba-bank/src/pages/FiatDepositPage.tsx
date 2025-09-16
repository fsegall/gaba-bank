import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { FiatDepositTransaction } from "./fiat-deposit/types";
import { generateReferenceCode } from "./fiat-deposit/utils";
import { FiatDepositHeader } from "./fiat-deposit/FiatDepositHeader";
import { WalletConnectionAlert } from "./fiat-deposit/WalletConnectionAlert";
import { DepositForm } from "./fiat-deposit/DepositForm";
import { DepositStatus } from "./fiat-deposit/DepositStatus";
import { DepositCompletion } from "./fiat-deposit/DepositCompletion";
import { HowItWorks } from "./fiat-deposit/HowItWorks";
import { VaultDepositModal } from "./fiat-deposit/VaultDepositModal";

export const FiatDeposit: React.FC = () => {
  const { wallet } = useWallet();

  // Form state
  const [amount, setAmount] = useState("");
  const [currency] = useState("USD"); // For now, only USD

  // Flow state
  const [currentTransaction, setCurrentTransaction] =
    useState<FiatDepositTransaction | null>(null);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [isOpeningLandmarkFlow, setIsOpeningLandmarkFlow] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ amount?: string }>({});

  const validateAmount = (value: string): boolean => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) {
      setErrors({ amount: "Please enter a valid amount" });
      return false;
    }
    if (numValue < 10) {
      setErrors({ amount: "Minimum deposit is $10" });
      return false;
    }
    if (numValue > 50000) {
      setErrors({ amount: "Maximum deposit is $50,000" });
      return false;
    }
    setErrors({});
    return true;
  };

  const simulateDepositProgress = () => {
    // Simulate Landmark flow progression
    setTimeout(() => {
      setCurrentTransaction((prev) =>
        prev
          ? {
              ...prev,
              status: "in_progress",
              lastUpdated: new Date(),
            }
          : null,
      );
    }, 2000);

    // Simulate completion (90% success rate)
    setTimeout(
      () => {
        const isSuccess = Math.random() > 0.1;
        setCurrentTransaction((prev) =>
          prev
            ? {
                ...prev,
                status: isSuccess ? "completed" : "failed",
                lastUpdated: new Date(),
                completedAt: isSuccess ? new Date() : undefined,
                failureReason: isSuccess
                  ? undefined
                  : "Landmark declined the transaction",
              }
            : null,
        );
      },
      8000 + Math.random() * 5000,
    ); // 8-13 seconds
  };

  const handleOpenLandmarkFlow = async () => {
    if (!validateAmount(amount)) return;

    setIsOpeningLandmarkFlow(true);

    try {
      // Create new transaction
      const transaction: FiatDepositTransaction = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        currency,
        status: "pending",
        referenceCode: generateReferenceCode(),
        LandmarkName: "Demo Landmark",
        lastUpdated: new Date(),
      };

      // Simulate opening Landmark flow
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In real implementation, this would open the Landmark's website
      const LandmarkUrl = `https://demo-Landmark.com/sep24-deposit?amount=${transaction.amount}&ref=${transaction.referenceCode}`;

      // Mock opening in new window
      console.log("Opening Landmark flow:", LandmarkUrl);

      setCurrentTransaction(transaction);
      simulateDepositProgress();
    } catch (error) {
      console.error("Failed to initiate Landmark flow:", error);
    } finally {
      setIsOpeningLandmarkFlow(false);
    }
  };

  const handleRetryDeposit = () => {
    setCurrentTransaction(null);
    setAmount("");
  };

  const handleDepositToVault = () => {
    setShowVaultModal(true);
  };

  return (
    <div className="space-y-8">
      <FiatDepositHeader />
      <WalletConnectionAlert />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {!currentTransaction ? (
            <DepositForm
              amount={amount}
              setAmount={setAmount}
              currency={currency}
              errors={errors}
              setErrors={setErrors}
              handleOpenLandmarkFlow={handleOpenLandmarkFlow}
              isOpeningLandmarkFlow={isOpeningLandmarkFlow}
              walletStatus={wallet.status}
            />
          ) : (
            <DepositStatus
              transaction={currentTransaction}
              onRetry={handleRetryDeposit}
            />
          )}
        </div>

        <div className="space-y-6">
          {currentTransaction?.status === "completed" ? (
            <DepositCompletion
              transaction={currentTransaction}
              onDepositToVault={handleDepositToVault}
              onStartNewDeposit={handleRetryDeposit}
            />
          ) : (
            <HowItWorks />
          )}
        </div>
      </div>

      <VaultDepositModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        transaction={currentTransaction}
      />
    </div>
  );
};
