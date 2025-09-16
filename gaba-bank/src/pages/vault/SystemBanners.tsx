import React from "react";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface SystemBannersProps {
  contractPaused: boolean;
  wrongNetwork: boolean;
}

export const SystemBanners: React.FC<SystemBannersProps> = ({
  contractPaused,
  wrongNetwork,
}) => (
  <>
    {contractPaused && (
      <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Contract Paused:</strong> Deposits and withdrawals are
          temporarily disabled for maintenance.
        </AlertDescription>
      </Alert>
    )}
    {wrongNetwork && (
      <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Wrong Network:</strong> Please switch to Stellar TESTNET to
          interact with the vault.
        </AlertDescription>
      </Alert>
    )}
  </>
);
