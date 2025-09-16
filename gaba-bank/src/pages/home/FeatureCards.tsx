import React from "react";
import { Link } from "react-router-dom";
import { CardSkeleton } from "../../components/CardSkeleton";
import { Wallet, ArrowUpDown, CoinsIcon } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

export const FeatureCards: React.FC = () => {
  const { isLoadingVaults } = useWallet();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-28">
      {isLoadingVaults ? (
        <>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </>
      ) : (
        <>
          {/* Vault Card */}
          <Link
            to="/vault"
            className="group relative flex flex-col bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-8 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden min-h-[320px]"
          >
            {/* Hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header: Icon, Title, and Earn Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
                    <Wallet className="h-6 w-6 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-[var(--sand-200)] group-hover:text-[var(--sun-400)] transition-colors duration-300">
                    Vault
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-[var(--clay-400)] text-sm leading-relaxed mb-8 group-hover:text-[var(--clay-300)] transition-colors duration-300">
                DeFi investments with fixed products stratified by risk
              </p>

              {/* Value Display with Purple Gradient */}
              <div className="flex-1 flex flex-col justify-center space-y-2 mb-8">
                <div
                  className="text-3xl font-bold text-[var(--sun-400)] group-hover:from-purple-300 group-hover:via-purple-400 group-hover:to-purple-500 transition-all duration-500 animate-[shimmer_2s_ease-in-out_infinite_alternate]"
                  style={{
                    backgroundSize: "200% 200%",
                    animation: "shimmer 2s ease-in-out infinite alternate",
                  }}
                >
                  12,345.67 USDC
                </div>
                <p className="text-[var(--clay-400)] text-sm font-medium">
                  Total Value Locked
                </p>
              </div>

              {/* Call to Action */}
              <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-[var(--clay-300)] text-sm font-medium group-hover:text-[var(--sun-400)] transition-colors duration-300">
                  Click to start earning →
                </span>
              </div>
            </div>
          </Link>

          {/* Swap Card */}
          <Link
            to="/swap"
            className="group relative flex flex-col bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-8 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden min-h-[320px]"
          >
            {/* Hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header: Icon, Title, and Earn Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
                    <ArrowUpDown className="h-8 w-8 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-[var(--sand-200)] group-hover:text-[var(--sun-400)] transition-colors duration-300">
                    Vault
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-[var(--clay-400)] text-sm leading-relaxed mb-8 group-hover:text-[var(--clay-300)] transition-colors duration-300">
                Exchange BRLD ↔ USDC with Soroswap integration
              </p>

              {/* Value Display with Purple Gradient */}
              <div className="flex-1 flex flex-col justify-center space-y-2 mb-8">
                <div
                  className="text-3xl font-bold text-[var(--sun-400)] group-hover:from-purple-300 group-hover:via-purple-400 group-hover:to-purple-500 transition-all duration-500 animate-[shimmer_2s_ease-in-out_infinite_alternate]"
                  style={{
                    backgroundSize: "200% 200%",
                    animation: "shimmer 2s ease-in-out infinite alternate",
                  }}
                >
                  Trade BRLD ↔ USDC
                </div>
                <p className="text-[var(--clay-400)] text-sm font-medium">
                  Available Pair
                </p>
              </div>

              {/* Call to Action */}
              <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-[var(--clay-300)] text-sm font-medium group-hover:text-[var(--sun-400)] transition-colors duration-300">
                  Trade now →
                </span>
              </div>
            </div>
          </Link>

          {/* Fiat Deposit Card */}
          <Link
            to="/deposit"
            className="group relative flex flex-col bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-8 rounded-3xl transition-all duration-500 hover:border-[var(--sun-500)]/10 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--sun-500)]/20 overflow-hidden min-h-[320px]"
          >
            {/* Hover glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header: Icon, Title, and Earn Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[var(--earth-800)] to-[var(--earth-900)] rounded-xl border border-[rgba(245,242,237,0.2)]/20 group-hover:border-[var(--sun-500)]/10 shadow-lg group-hover:scale-110 group-hover:shadow-[var(--sun-500)]/30 transition-all duration-300">
                    <CoinsIcon className="h-8 w-8 text-[var(--clay-400)] group-hover:text-yellow-300 transition-colors duration-300" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-[var(--sand-200)] group-hover:text-[var(--sun-400)] transition-colors duration-300">
                    Fiat Deposit
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-[var(--clay-400)] text-sm leading-relaxed mb-8 group-hover:text-[var(--clay-300)] transition-colors duration-300">
                Bridge traditional banking with SEP-24 integration
              </p>

              {/* Value Display with Purple Gradient */}
              <div className="flex-1 flex flex-col justify-center space-y-2 mb-8">
                <div
                  className="text-3xl font-bold text-[var(--sun-400)] group-hover:from-purple-300 group-hover:via-purple-400 group-hover:to-purple-500 transition-all duration-500 animate-[shimmer_2s_ease-in-out_infinite_alternate]"
                  style={{
                    backgroundSize: "200% 200%",
                    animation: "shimmer 2s ease-in-out infinite alternate",
                  }}
                >
                  SEP-24
                </div>
                <p className="text-[var(--clay-400)] text-sm font-medium">
                  Bank Integration
                </p>
              </div>

              {/* Call to Action */}
              <div className="flex items-center group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-[var(--clay-300)] text-sm font-medium group-hover:text-[var(--sun-400)] transition-colors duration-300">
                  Fund your account →
                </span>
              </div>
            </div>
          </Link>
        </>
      )}
    </div>
  );
};
