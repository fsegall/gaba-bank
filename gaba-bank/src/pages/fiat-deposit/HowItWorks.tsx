import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Landmark } from "lucide-react";

export const HowItWorks: React.FC = () => {
  return (
    <Card className="bg-[var(--earth-700)]/60 border border-[rgba(245,242,237,0.1)] rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-[var(--sand-200)]">
          <Landmark className="h-6 w-6 text-[var(--sand-200)]" />
          How It Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sun-400)] text-[var(--earth-900)] text-xs font-bold flex items-center justify-center">
              1
            </div>
            <div>
              <div className="font-medium text-[var(--sand-200)] text-sm">
                Enter Amount
              </div>
              <div className="text-xs text-[var(--clay-400)]">
                Specify how much fiat currency to deposit
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sun-400)] text-[var(--earth-900)] text-xs font-bold flex items-center justify-center">
              2
            </div>
            <div>
              <div className="font-medium text-[var(--sand-200)] text-sm">
                Landmark Authentication
              </div>
              <div className="text-xs text-[var(--clay-400)]">
                Securely connect and verify your Landmark account
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sun-400)] text-[var(--earth-900)] text-xs font-bold flex items-center justify-center">
              3
            </div>
            <div>
              <div className="font-medium text-[var(--sand-200)] text-sm">
                Transfer Processing
              </div>
              <div className="text-xs text-[var(--clay-400)]">
                Landmark initiates secure transfer to your wallet
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--sun-400)] text-[var(--earth-900)] text-xs font-bold flex items-center justify-center">
              4
            </div>
            <div>
              <div className="font-medium text-[var(--sand-200)] text-sm">
                Funds Available
              </div>
              <div className="text-xs text-[var(--clay-400)]">
                USDC appears in your wallet, ready for vault deposit
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[rgba(245,242,237,0.1)]">
          <div className="text-xs text-[var(--clay-400)] space-y-1">
            <div>• Landmark-grade security and encryption</div>
            <div>• Compliant with financial regulations</div>
            <div>• 24/7 transaction monitoring</div>
            <div>• Instant wallet credit upon completion</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
