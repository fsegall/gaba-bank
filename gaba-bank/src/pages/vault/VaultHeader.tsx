import React from "react";

export const VaultHeader: React.FC = () => (
  <div className="text-center">
    <h1 className="font-display text-4xl font-bold text-[var(--sand-200)]">
      Vault Dashboard
    </h1>
    <p className="mt-4 text-lg text-[var(--clay-400)] max-w-2xl mx-auto">
      View metrics, deposit funds, withdraw earnings, and track your vault
      activity.
    </p>
  </div>
);
