import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

export const FinalCTA: React.FC = () => {
  const { wallet, toggleWallet } = useWallet();

  return (
    <div className="text-center bg-gradient-to-br from-[var(--earth-700)] to-[var(--earth-800)] border border-[rgba(245,242,237,0.15)] rounded-3xl p-12 backdrop-blur-sm">
      <h2 className="font-display text-3xl font-bold text-[var(--sand-200)] mb-4">
        Ready to Start Your DeFi Journey?
      </h2>
      <p className="text-[var(--clay-400)] mb-8 max-w-xl mx-auto">
        Join the future of banking with Stellar's fast, secure, and affordable
        blockchain technology.
      </p>

      {wallet.status !== "connected" ? (
        <Button
          onClick={() => void toggleWallet()}
          disabled={wallet.status === "connecting"}
          className="bg-gradient-to-r from-[var(--sun-500)] to-[var(--sun-400)] text-[var(--earth-800)] p-6 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[var(--sun-500)]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {wallet.status === "connecting" ? (
            <>
              <div className="w-5 h-5 border-2 border-[var(--earth-800)] border-t-transparent rounded-full animate-spin mr-3" />
              Connecting Wallet...
            </>
          ) : (
            <>Connect Wallet to Begin →</>
          )}
        </Button>
      ) : (
        <Link
          to="/home"
          className="inline-flex items-center gap-3 bg-gradient-to-r from-[var(--forest-500)] to-[var(--forest-700)] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[var(--forest-500)]/30"
        >
          <CheckCircle className="w-5 h-5" />
          Go to Home
          <ArrowRight className="w-5 h-5" />
        </Link>
      )}
    </div>
  );
};
