import { useState, useCallback } from "react";
import { useWallet } from "../contexts/WalletContext";

export interface WalletGuardConfig {
  feature?: string;
  title?: string;
  description?: string;
  onConnectSuccess?: () => void;
  onConnectError?: (error: Error) => void;
}

export const useWalletGuard = (config: WalletGuardConfig = {}) => {
  const { wallet, connectWallet } = useWallet();
  const [showDialog, setShowDialog] = useState(false);

  const isWalletConnected = wallet.status === "connected";

  // Check if wallet is connected and show dialog if not
  const requireWallet = useCallback(
    (callback?: () => void) => {
      if (isWalletConnected) {
        callback?.();
        return true;
      } else {
        setShowDialog(true);
        return false;
      }
    },
    [isWalletConnected],
  );

  // Connect wallet with error handling
  const handleConnectWallet = useCallback(async () => {
    try {
      await connectWallet();
      config.onConnectSuccess?.();
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error("Failed to connect wallet");
      config.onConnectError?.(errorObj);
      throw errorObj;
    }
  }, [connectWallet, config]);

  // Close dialog
  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  return {
    isWalletConnected,
    showDialog,
    requireWallet,
    handleConnectWallet,
    closeDialog,
    walletStatus: wallet.status,
    walletAddress: wallet.address,
  };
};
