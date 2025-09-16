import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { ArrowRight, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

type DepositStep = "input" | "review" | "sign";

interface DepositModalProps {
  depositModal: boolean;
  setDepositModal: (isOpen: boolean) => void;
  metrics: { pps: number };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const DepositModal: React.FC<DepositModalProps> = ({
  depositModal,
  setDepositModal,
  metrics,
}) => {
  const { wallet } = useWallet();
  const [depositStep, setDepositStep] = useState<DepositStep>("input");
  const [depositAmount, setDepositAmount] = useState("");
  const userUSDCBalance = 5000; // Mock balance

  const estimatedShares = depositAmount
    ? Math.floor((parseFloat(depositAmount) / metrics.pps) * 0.99)
    : 0;

  return (
    <Dialog open={depositModal} onOpenChange={setDepositModal}>
      <DialogContent className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl shadow-2xl w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-[var(--sand-200)]">
            Deposit to Vault
          </DialogTitle>
        </DialogHeader>
        <div className="p-6">
          {depositStep === "input" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--clay-400)]">Amount (USDC)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="bg-[var(--earth-800)] border border-[rgba(245,242,237,0.1)] rounded-lg w-full p-3 pr-20 text-[var(--sand-200)] font-mono text-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDepositAmount(userUSDCBalance.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--sun-400)] hover:text-[var(--sun-500)] p-1 h-auto"
                  >
                    MAX
                  </Button>
                </div>
                <div className="text-xs text-[var(--clay-400)]">
                  Balance: {formatCurrency(userUSDCBalance)}
                </div>
              </div>
              {depositAmount && (
                <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--clay-400)]">
                      You'll mint ≈
                    </span>
                    <span className="text-[var(--sand-200)] font-mono">
                      {estimatedShares.toLocaleString()} shares
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--clay-400)]">
                      1% deposit fee
                    </span>
                    <span className="text-[var(--red-400)]">
                      -{formatCurrency(parseFloat(depositAmount) * 0.01)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={() => setDepositModal(false)}
                  variant="outline"
                  className="flex-1 border-[rgba(245,242,237,0.2)] text-[var(--sand-200)]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setDepositStep("review")}
                  disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 cta-button"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
          {depositStep === "review" && (
            <div className="space-y-4">
              <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">From</span>
                  <span className="text-[var(--sand-200)] font-mono text-sm">
                    wallet...{wallet.address?.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">To</span>
                  <span className="text-[var(--sand-200)] font-mono text-sm">
                    vault...contract
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">Amount</span>
                  <span className="text-[var(--sand-200)] font-mono">
                    {formatCurrency(parseFloat(depositAmount))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">Est. shares</span>
                  <span className="text-[var(--forest-500)] font-mono">
                    {estimatedShares.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">Fee (1%)</span>
                  <span className="text-[var(--red-400)] font-mono">
                    {formatCurrency(parseFloat(depositAmount) * 0.01)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">PPS</span>
                  <span className="text-[var(--sand-200)] font-mono">
                    ${metrics.pps.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--clay-400)]">Network</span>
                  <Badge className="bg-[var(--river-500)]/10 text-[var(--river-500)]">
                    TESTNET
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setDepositStep("input")}
                  variant="outline"
                  className="flex-1 border-[rgba(245,242,237,0.2)] text-[var(--sand-200)]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setDepositStep("sign")}
                  className="flex-1 cta-button"
                >
                  Sign Transaction
                </Button>
              </div>
            </div>
          )}
          {depositStep === "sign" && (
            <div className="space-y-4 text-center">
              <div className="space-y-3">
                <Loader2 className="w-12 h-12 text-[var(--sun-400)] animate-spin mx-auto" />
                <div>
                  <div className="text-lg font-bold text-[var(--sand-200)]">
                    Processing Transaction
                  </div>
                  <div className="text-sm text-[var(--clay-400)] mt-1">
                    Building XDR → Freighter prompt → Pending...
                  </div>
                </div>
              </div>
              <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 text-left">
                <div className="text-sm text-[var(--clay-400)] mb-2">
                  Transaction Hash:
                </div>
                <div className="font-mono text-xs text-[var(--sand-200)]">
                  abc123...def789
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-[var(--sun-400)] hover:text-[var(--sun-500)] p-0 h-auto"
                >
                  View on Explorer
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <Button
                onClick={() => {
                  setDepositModal(false);
                  setDepositStep("input");
                  setDepositAmount("");
                }}
                className="w-full cta-success"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
