import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle, Vault, ArrowRight } from "lucide-react";
import { FiatDepositTransaction } from "./types";
import { formatCurrency } from "./utils";

interface DepositCompletionProps {
  transaction: FiatDepositTransaction;
  onDepositToVault: () => void;
  onStartNewDeposit: () => void;
}

export const DepositCompletion: React.FC<DepositCompletionProps> = ({
  transaction,
  onDepositToVault,
  onStartNewDeposit,
}) => {
  return (
    <Card className="bg-gradient-to-br from-[var(--forest-700)]/20 to-[var(--forest-800)]/20 border border-[var(--forest-500)]/20 rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[var(--forest-400)]">
          <CheckCircle className="h-6 w-6" />
          Deposit Successful!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-[var(--sand-200)]">
          Your fiat deposit of{" "}
          <strong>{formatCurrency(transaction.amount)}</strong> has been
          processed successfully.
        </div>

        <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-[var(--sand-200)] text-sm">
            Next Step: Deposit to Vault
          </h4>
          <p className="text-xs text-[var(--clay-400)]">
            Your funds are now available in your wallet. You can deposit them to
            the vault to start earning yield.
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--clay-400)]">Detected Amount:</span>
            <span className="font-mono text-[var(--forest-500)]">
              {formatCurrency(transaction.amount)} USDC
            </span>
          </div>
        </div>

        <Button
          onClick={onDepositToVault}
          className="w-full py-3 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 bg-[var(--sand-200)]/5 text-[var(--sand-200)] border backdrop-blur-3xl"
        >
          <Vault className="w-5 h-5 mr-2" />
          Deposit to Vault
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          onClick={onStartNewDeposit}
          variant="ghost"
          className="w-full text-[var(--clay-400)] hover:text-[var(--sand-200)]"
        >
          Start New Deposit
        </Button>
      </CardContent>
    </Card>
  );
};
