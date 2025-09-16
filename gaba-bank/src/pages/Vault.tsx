import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { useWalletGuard } from "../hooks/useWalletGuard";
import { WalletConnectionDialog } from "../components/WalletConnectionDialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Wallet } from "lucide-react";
import { VaultHeader } from "./vault/VaultHeader";
import { SystemBanners } from "./vault/SystemBanners";
import { KpiTiles } from "./vault/KpiTiles";
import { ActionBar } from "./vault/ActionBar";
import { EventsTable } from "./vault/EventsTable";
import { DepositModal } from "./vault/DepositModal";

// Mock data types
interface VaultMetrics {
  pps: number;
  tvl: number;
  totalShares: number;
  isLoading: boolean;
  lastUpdated: Date;
}

interface VaultEvent {
  id: string;
  time: Date;
  event: "Deposit" | "Withdraw" | "Sweep";
  amountUSDC: number;
  shares: number;
  txHash: string;
  status: "Pending" | "Success" | "Failed";
}

type DepositStep = "input" | "review" | "sign";

interface SystemBanners {
  contractPaused: boolean;
  wrongNetwork: boolean;
}

export const Vault: React.FC = () => {
  const { wallet } = useWallet();

  // Wallet guard for vault operations
  const walletGuard = useWalletGuard({
    feature: "vault operations",
    title: "Connect Wallet to Access Vault",
    description:
      "You need to connect your wallet to access vault features, view your investments, and make transactions.",
  });

  // State for vault metrics
  const [metrics, setMetrics] = useState<VaultMetrics>({
    pps: 0,
    tvl: 0,
    totalShares: 0,
    isLoading: true,
    lastUpdated: new Date(),
  });

  // State for events
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<
    "All" | "Deposits" | "Withdrawals"
  >("All");
  const [eventsLoading, setEventsLoading] = useState(true);

  // Modal states
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [depositStep, setDepositStep] = useState<DepositStep>("input");

  // Form states
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");

  // System banners
  const [banners] = useState<SystemBanners>({
    contractPaused: false, // Set to true to test
    wrongNetwork: false,
  });

  // Mock data loading
  useEffect(() => {
    // Simulate loading metrics
    setTimeout(() => {
      setMetrics({
        pps: 1.0234,
        tvl: 2400000,
        totalShares: 2344567,
        isLoading: false,
        lastUpdated: new Date(),
      });
    }, 1500);

    // Simulate loading events
    setTimeout(() => {
      setEvents([
        {
          id: "1",
          time: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          event: "Deposit",
          amountUSDC: 1000,
          shares: 977,
          txHash: "abc123...def789",
          status: "Success",
        },
        {
          id: "2",
          time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          event: "Withdraw",
          amountUSDC: 500,
          shares: -489,
          txHash: "ghi456...jkl012",
          status: "Success",
        },
        {
          id: "3",
          time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          event: "Deposit",
          amountUSDC: 2000,
          shares: 1954,
          txHash: "mno789...pqr345",
          status: "Success",
        },
      ]);
      setEventsLoading(false);
    }, 1000);
  }, [wallet.status]);

  // Computed values
  const estimatedShares = depositAmount
    ? Math.floor((parseFloat(depositAmount) / metrics.pps) * 0.99)
    : 0; // 1% fee
  const estimatedUSDC = withdrawShares
    ? Math.floor(parseFloat(withdrawShares) * metrics.pps)
    : 0;
  const userUSDCBalance = 5000; // Mock balance
  const userShares = 1954; // Mock user shares

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (eventFilter === "All") return true;
    if (eventFilter === "Deposits") return event.event === "Deposit";
    if (eventFilter === "Withdrawals") return event.event === "Withdraw";
    return true;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  // Show wallet connection prompt if not connected
  if (!walletGuard.isWalletConnected) {
    return (
      <div className="space-y-8">
        <VaultHeader />

        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 bg-[var(--sun-500)]/10 rounded-full flex items-center justify-center">
              <Wallet className="w-8 h-8 text-[var(--sun-500)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--sand-200)] mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-[var(--clay-400)] mb-6">
              Please connect your wallet to access vault features and view your
              investments.
            </p>
            <Button
              onClick={() => walletGuard.requireWallet()}
              className="bg-gradient-to-r from-[var(--sun-500)] to-[var(--sun-600)] hover:from-[var(--sun-600)] hover:to-[var(--sun-700)] text-[var(--earth-900)]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>

        {/* Wallet Connection Dialog */}
        <WalletConnectionDialog
          open={walletGuard.showDialog}
          onOpenChange={walletGuard.closeDialog}
          onConnectWallet={walletGuard.handleConnectWallet}
          title="Connect Wallet to Access Vault"
          description="You need to connect your wallet to access vault features, view your investments, and make transactions."
          feature="vault operations"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <VaultHeader />

      <SystemBanners
        contractPaused={banners.contractPaused}
        wrongNetwork={banners.wrongNetwork}
      />

      <KpiTiles metrics={metrics} />

      <ActionBar
        setDepositModal={setDepositModal}
        setWithdrawModal={setWithdrawModal}
        userShares={userShares}
        banners={banners}
      />

      <EventsTable
        events={events}
        eventFilter={eventFilter}
        setEventFilter={setEventFilter}
        eventsLoading={eventsLoading}
      />

      <DepositModal
        depositModal={depositModal}
        setDepositModal={setDepositModal}
        metrics={metrics}
      />

      {/* Similar Withdraw Modal structure */}
      <Dialog open={withdrawModal} onOpenChange={setWithdrawModal}>
        <DialogContent className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl shadow-2xl w-full max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-[var(--sand-200)]">
              Withdraw from Vault
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[var(--clay-400)]">
                  Shares to withdraw
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={withdrawShares}
                    onChange={(e) => setWithdrawShares(e.target.value)}
                    className="bg-[var(--earth-800)] border border-[rgba(245,242,237,0.1)] rounded-lg w-full p-3 pr-20 text-[var(--sand-200)] font-mono text-lg"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWithdrawShares(userShares.toString())}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--sun-400)] hover:text-[var(--sun-500)] p-1 h-auto"
                  >
                    MAX
                  </Button>
                </div>
                <div className="text-xs text-[var(--clay-400)]">
                  Your shares: {userShares.toLocaleString()}
                </div>
              </div>

              {withdrawShares && (
                <div className="bg-[var(--earth-800)]/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--clay-400)]">
                      You'll receive ≈
                    </span>
                    <span className="text-[var(--sand-200)] font-mono">
                      {formatCurrency(estimatedUSDC)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setWithdrawModal(false)}
                  variant="outline"
                  className="flex-1 border-[rgba(245,242,237,0.2)] text-[var(--sand-200)]"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!withdrawShares || parseFloat(withdrawShares) <= 0}
                  className="flex-1 cta-button"
                >
                  Withdraw
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Connection Dialog */}
      <WalletConnectionDialog
        open={walletGuard.showDialog}
        onOpenChange={walletGuard.closeDialog}
        onConnectWallet={walletGuard.handleConnectWallet}
        title="Connect Wallet to Access Vault"
        description="You need to connect your wallet to access vault features, view your investments, and make transactions."
        feature="vault operations"
      />
    </div>
  );
};
