import React from "react";

export const HowItWorks: React.FC = () => {
  return (
    <div className="text-center space-y-12">
      <h2 className="font-display text-3xl font-bold text-[var(--sand-200)]">
        How It Works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="relative">
          <div
            className="inline-flex items-center justify-center w-12 h-12 
            bg-yellow-100 text-[var(--earth-800)] rounded-full font-bold text-xl mb-4 border-[rgba(245,242,237,0.2)]/40 shadow-lg"
          >
            1
          </div>
          <h3 className="font-display font-bold text-lg text-[var(--sand-200)] mb-2">
            Connect
          </h3>
          <p className="text-[var(--clay-400)] text-sm">
            Link your Stellar wallet securely
          </p>
        </div>

        <div className="relative">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-200 text-[var(--earth-800)] rounded-full font-bold text-xl mb-4 border-[rgba(245,242,237,0.2)]/40 shadow-lg">
            2
          </div>
          <h3 className="font-display font-bold text-lg text-[var(--sand-200)] mb-2">
            Verify
          </h3>
          <p className="text-[var(--clay-400)] text-sm">
            Complete KYC for full access
          </p>
        </div>

        <div className="relative">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-300 text-[var(--earth-800)] rounded-full font-bold text-xl mb-4 border-[rgba(245,242,237,0.2)]/40 shadow-lg">
            3
          </div>
          <h3 className="font-display font-bold text-lg text-[var(--sand-200)] mb-2">
            Choose Service
          </h3>
          <p className="text-[var(--clay-400)] text-sm">
            Select invest, funding, or banking
          </p>
        </div>

        <div className="relative">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-400 text-[var(--earth-800)] rounded-full font-bold text-xl mb-4 border-[rgba(245,242,237,0.2)]/40 shadow-lg">
            4
          </div>
          <h3 className="font-display font-bold text-lg text-[var(--sand-200)] mb-2">
            Start Banking
          </h3>
          <p className="text-[var(--clay-400)] text-sm">
            Enjoy decentralized finance
          </p>
        </div>
      </div>
    </div>
  );
};
