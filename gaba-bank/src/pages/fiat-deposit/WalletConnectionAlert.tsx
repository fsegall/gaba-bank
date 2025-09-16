import React from "react";
import { useWallet } from "../../contexts/WalletContext";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const WalletConnectionAlert: React.FC = () => {
  const { wallet, toggleWallet } = useWallet();

  if (wallet.status === "connected") {
    return null;
  }

  return (
    <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>Wallet Required:</strong> Please connect your wallet to proceed
        with fiat deposits.
        <Button
          onClick={toggleWallet}
          variant="ghost"
          size="sm"
          className="ml-2 text-yellow-200 hover:text-yellow-100 underline p-0 h-auto"
        >
          Connect Wallet
        </Button>
      </AlertDescription>
    </Alert>
  );
};
