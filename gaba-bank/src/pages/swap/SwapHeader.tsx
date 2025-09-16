import React from "react";

export const SwapHeader: React.FC = () => (
  <div className="text-center space-y-2">
    <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--sand-200)]">
      Token Swap
    </h1>
    <p className="text-[var(--clay-400)] text-lg max-w-2xl mx-auto">
      Instantly trade tokens on the Stellar network. Powered by Soroswap.
    </p>
  </div>
);
