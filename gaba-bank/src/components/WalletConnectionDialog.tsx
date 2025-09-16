import React from "react";
import { Wallet, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

interface WalletConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectWallet: () => Promise<void>;
  title?: string;
  description?: string;
  feature?: string;
}

export const WalletConnectionDialog: React.FC<WalletConnectionDialogProps> = ({
  open,
  onOpenChange,
  onConnectWallet,
  title = "Wallet Connection Required",
  description,
  feature = "this feature",
}) => {
  const defaultDescription = `To access ${feature}, you need to connect your wallet. This ensures secure access to your account and transactions.`;

  const handleConnectWallet = async () => {
    try {
      await onConnectWallet();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Keep dialog open on error so user can retry
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--sun-500)]/10 border border-[var(--sun-500)]/20">
              <AlertCircle className="h-6 w-6 text-[var(--sun-500)]" />
            </div>
            <div>
              <AlertDialogTitle className="text-left text-lg font-semibold">
                {title}
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left text-[var(--clay-400)]">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 p-4 bg-[var(--earth-700)]/30 rounded-lg border border-[var(--earth-600)]/30">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-[var(--sun-500)]" />
            <div>
              <p className="text-sm font-medium text-[var(--sand-200)]">
                Secure Connection
              </p>
              <p className="text-xs text-[var(--clay-400)]">
                Your wallet credentials are never stored on our servers
              </p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="flex-1">
              Maybe Later
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleConnectWallet}
              className="flex-1 bg-gradient-to-r from-[var(--sun-500)] to-[var(--sun-600)] hover:from-[var(--sun-600)] hover:to-[var(--sun-700)] text-[var(--earth-900)]"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
