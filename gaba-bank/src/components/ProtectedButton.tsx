import React from "react";
import { Button, ButtonProps } from "./ui/button";
import { useWalletGuard } from "../hooks/useWalletGuard";
import { WalletConnectionDialog } from "./WalletConnectionDialog";

interface ProtectedButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick?: () => void;
  feature?: string;
  walletRequiredTitle?: string;
  walletRequiredDescription?: string;
  children: React.ReactNode;
}

/**
 * A button component that requires wallet connection before executing the onClick handler.
 * If the wallet is not connected, it shows a connection dialog instead.
 */
export const ProtectedButton: React.FC<ProtectedButtonProps> = ({
  onClick,
  feature = "this feature",
  walletRequiredTitle = "Wallet Connection Required",
  walletRequiredDescription,
  children,
  ...buttonProps
}) => {
  const walletGuard = useWalletGuard({
    feature,
    title: walletRequiredTitle,
    description: walletRequiredDescription,
    onConnectSuccess: onClick,
  });

  const handleClick = () => {
    walletGuard.requireWallet(onClick);
  };

  return (
    <>
      <Button {...buttonProps} onClick={handleClick}>
        {children}
      </Button>

      <WalletConnectionDialog
        open={walletGuard.showDialog}
        onOpenChange={walletGuard.closeDialog}
        onConnectWallet={walletGuard.handleConnectWallet}
        title={walletRequiredTitle}
        description={walletRequiredDescription}
        feature={feature}
      />
    </>
  );
};
