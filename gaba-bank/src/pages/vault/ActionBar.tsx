import React from "react";
import { Button } from "../../components/ui/button";
import { TrendingUp, Wallet } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

interface ActionBarProps {
  setDepositModal: (isOpen: boolean) => void;
  setWithdrawModal: (isOpen: boolean) => void;
  userShares: number;
  banners: {
    contractPaused: boolean;
    wrongNetwork: boolean;
  };
}

export const ActionBar: React.FC<ActionBarProps> = ({
  setDepositModal,
  setWithdrawModal,
  userShares,
  banners,
}) => {
  const { wallet } = useWallet();

  return (
    <div className="flex gap-4 justify-center">
      <Button
        onClick={() => setDepositModal(true)}
        disabled={
          wallet.status !== "connected" ||
          banners.contractPaused ||
          banners.wrongNetwork
        }
        className="cta-button px-8 py-3 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-accent-cta)]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <TrendingUp className="w-5 h-5 mr-2" />
        Deposit
      </Button>
      <Button
        onClick={() => setWithdrawModal(true)}
        disabled={
          wallet.status !== "connected" ||
          banners.contractPaused ||
          banners.wrongNetwork ||
          userShares <= 0
        }
        className="btn-secondary px-8 py-3 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:border-[var(--color-accent-cta)]/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Wallet className="w-5 h-5 mr-2" />
        Withdraw
      </Button>
    </div>
  );
};
