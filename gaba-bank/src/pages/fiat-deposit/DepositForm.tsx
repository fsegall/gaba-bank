import React from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  CreditCard,
  DollarSign,
  ExternalLink,
  Landmark,
  Loader2,
} from "lucide-react";

interface DepositFormProps {
  amount: string;
  setAmount: (amount: string) => void;
  currency: string;
  errors: { amount?: string };
  setErrors: (errors: { amount?: string }) => void;
  handleOpenLandmarkFlow: () => void;
  isOpeningLandmarkFlow: boolean;
  walletStatus: string;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  amount,
  setAmount,
  currency,
  errors,
  setErrors,
  handleOpenLandmarkFlow,
  isOpeningLandmarkFlow,
  walletStatus,
}) => {
  return (
    <Card className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[var(--sand-200)]">
          <CreditCard className="h-6 w-6 text-[var(--sun-400)]" />
          Start Deposit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[var(--clay-400)] font-medium">
              Amount ({currency})
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--clay-400)]" />
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors({});
                }}
                className="bg-[var(--earth-800)] border border-[rgba(245,242,237,0.1)] rounded-lg pl-10 text-[var(--sand-200)] font-mono text-lg"
                min="10"
                max="50000"
                step="0.01"
              />
            </div>
            {errors.amount && (
              <p className="text-red-400 text-sm">{errors.amount}</p>
            )}
            <div className="text-xs text-[var(--clay-400)]">
              Minimum: $10 • Maximum: $50,000
            </div>
          </div>

          {/* Info Copy */}
          <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-[var(--sand-200)] text-sm">
              SEP-24 Landmark Integration
            </h4>
            <ul className="space-y-1 text-xs text-[var(--clay-400)]">
              <li>• Secure Landmark-to-wallet transfer</li>
              <li>• Processing time: 5-15 minutes</li>
              <li>• Landmark-grade encryption and compliance</li>
              <li>• Supported Landmarks: Most US institutions</li>
            </ul>
          </div>

          <Button
            onClick={handleOpenLandmarkFlow}
            disabled={
              walletStatus !== "connected" || isOpeningLandmarkFlow || !amount
            }
            className="w-full cta-button py-3 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-accent-cta)]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isOpeningLandmarkFlow ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Opening Landmark Flow...
              </>
            ) : (
              <>
                <Landmark className="w-5 h-5 mr-2" />
                Open Landmark Flow
                <ExternalLink className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
