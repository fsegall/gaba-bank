import React from "react";

export const FiatDepositHeader: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="font-display text-4xl font-bold text-[var(--sand-200)]">
        Fiat Deposit
      </h1>
      <p className="mt-4 text-lg text-[var(--clay-400)] max-w-2xl mx-auto">
        Deposit fiat currency through SEP-24 Landmark integration. Connect your
        Landmark account to fund your wallet securely.
      </p>
    </div>
  );
};
