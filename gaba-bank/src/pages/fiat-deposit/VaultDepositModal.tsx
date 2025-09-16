import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { FiatDepositTransaction } from "./types";
import { formatCurrency } from "./utils";

interface VaultDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: FiatDepositTransaction | null;
}

export const VaultDepositModal: React.FC<VaultDepositModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[var(--sand-200)]">
            Deposit to Vault
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="text-[var(--sand-200)]">
            Ready to deposit{" "}
            <strong>{formatCurrency(transaction.amount)}</strong> to the vault?
          </div>
          <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-400)]">Amount</span>
              <span className="text-[var(--sand-200)] font-mono">
                {formatCurrency(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-400)]">Estimated Shares</span>
              <span className="text-[var(--forest-500)] font-mono">
                {Math.floor(transaction.amount / 1.02).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[rgba(245,242,237,0.2)] text-[var(--sand-200)]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // This would integrate with the existing Vault deposit flow
                console.log("Depositing to vault:", transaction.amount);
                onClose();
              }}
              className="flex-1 cta-button"
            >
              Confirm Deposit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
