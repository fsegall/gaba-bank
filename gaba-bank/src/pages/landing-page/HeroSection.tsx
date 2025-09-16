import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { TrendingUp, Users, Wallet, CheckCircle } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";
import { useWalletGuard } from "../../hooks/useWalletGuard";
import { WalletConnectionDialog } from "../../components/WalletConnectionDialog";

export const HeroSection: React.FC = () => {
  const { wallet, toggleWallet } = useWallet();
  const navigate = useNavigate();

  // Wallet guard for vault (investment) access
  const vaultWalletGuard = useWalletGuard({
    feature: "the vault and investment features",
    title: "Connect Wallet to Invest",
    description:
      "To access your portfolio and make investments, you need to connect your wallet. This ensures secure access to your funds and transaction history.",
    onConnectSuccess: () => navigate("/vault"),
  });

  return (
    <div className="text-center relative">
      <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 bg-[var(--sun-500)]/20 rounded-full blur-3xl -z-10 opacity-40" />

      {/* Stellar Network Badge */}
      <div
        className="inline-flex items-center gap-2 bg-[var(--earth-700)]/60 backdrop-blur-sm border border-[rgba(245,242,237,0.2)] rounded-full px-4 py-2 mb-8 animate-slide-in-bottom"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="w-2 h-2 bg-[var(--sun-500)] rounded-full animate-pulse" />
        <span className="text-sm text-[var(--clay-400)]">
          Powered by Stellar Network
        </span>
      </div>

      <h1
        className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight !leading-tight animate-slide-in-bottom"
        style={{ animationDelay: "0.3s" }}
      >
        <span className="text-transparent bg-clip-text bg-gradient-to-br from-[var(--sand-200)] to-[var(--clay-400)]">
          Decentralized
          <br />
          Community Bank
        </span>
      </h1>

      <p
        className="mt-6 max-w-2xl mx-auto text-lg text-[var(--clay-400)] animate-slide-in-bottom tracking-normal"
        style={{ animationDelay: "0.5s" }}
      >
        Banking reimagined for the decentralized future. Join thousands building
        financial freedom on the Stellar blockchain with fast, secure, and
        global access.
      </p>

      {/* Main CTA Cards */}
      <div
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto animate-slide-in-bottom"
        style={{ animationDelay: "0.7s" }}
      >
        <Card
          className="group h-40 hover:scale-105 cursor-pointer
          bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-10 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden w-full items-center justify-center
          "
          onClick={() => vaultWalletGuard.requireWallet()}
        >
          {/* Hover glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
          <CardContent className="p-4 text-center space-y-2">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
              <TrendingUp className="h-4 w-4 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
            </div>
            <h3 className="font-semibold text-[var(--sand-200)] text-xl">
              Invest
            </h3>
            <p className=" text-[var(--clay-400)] text-sm font-medium group-hover:text-[var(--clay-300)] transition-colors duration-300">
              Grow your portfolio →
            </p>
          </CardContent>
        </Card>

        <Link to="/onboarding">
          <Card
            className="group h-40 hover:scale-105 cursor-pointer
            bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-10 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden w-full items-center justify-center
            "
          >
            {/* Hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
            <CardContent className="p-4 text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
                <Users className="h-4 w-4 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
              </div>
              <h3 className="font-semibold text-[var(--sand-200)] text-xl">
                Get Funded
              </h3>
              <p className=" text-[var(--clay-400)] text-sm font-medium group-hover:text-[var(--clay-300)] transition-colors duration-300">
                Fund your project →
              </p>
            </CardContent>
          </Card>
        </Link>

        {wallet.status !== "connected" ? (
          <Card
            className="group h-40 hover:scale-105 cursor-pointer
          bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-10 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden w-full items-center justify-center
          "
            onClick={() => void toggleWallet()}
          >
            {/* Hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
            <CardContent className="p-4 text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
                {wallet.status === "connecting" ? (
                  <div className="w-5 h-5 border-2 border-[var(--sand-200)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
                )}
              </div>
              <h3 className="font-semibold text-[var(--sand-200)] text-xl">
                {wallet.status === "connecting"
                  ? "Connecting..."
                  : "Open Account"}
              </h3>
              <p className=" text-[var(--clay-400)] text-sm font-medium group-hover:text-[var(--clay-300)] transition-colors duration-300">
                {wallet.status === "connecting"
                  ? "Please wait"
                  : "Start banking →"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Link to="/home">
            <Card
              className="group h-40 hover:scale-105 cursor-pointer
            bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-10 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden w-80 items-center justify-center
            "
            >
              {/* Hover glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
              <CardContent className="p-4 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
                  <CheckCircle className="h-4 w-4 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
                </div>
                <h3 className="font-semibold text-[var(--sand-200)] text-xl">
                  Connected
                </h3>
                <p className=" text-[var(--clay-400)] text-sm font-medium group-hover:text-[var(--clay-300)] transition-colors duration-300">
                  Go to Home →
                </p>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* Wallet Connection Dialog */}
      <WalletConnectionDialog
        open={vaultWalletGuard.showDialog}
        onOpenChange={vaultWalletGuard.closeDialog}
        onConnectWallet={vaultWalletGuard.handleConnectWallet}
        title="Connect Wallet to Invest"
        description="To access your portfolio and make investments, you need to connect your wallet. This ensures secure access to your funds and transaction history."
        feature="the vault and investment features"
      />
    </div>
  );
};
