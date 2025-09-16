import React from "react";
import { Zap, Shield, Globe } from "lucide-react";

export const TrustIndicators: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--earth-700)] to-[var(--earth-800)] rounded-2xl border border-[rgba(245,242,237,0.2)]/20 shadow-lg">
          <Zap className="h-8 w-8 text-[var(--sun-400)]" />
        </div>
        <h3 className="font-display font-bold text-xl text-[var(--sand-200)]">
          Lightning Fast
        </h3>
        <p className="text-[var(--clay-400)] text-base leading-relaxed">
          3-5 second transactions on Stellar network with minimal fees
        </p>
      </div>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--earth-700)] to-[var(--earth-800)] rounded-2xl border border-[rgba(245,242,237,0.2)]/20 shadow-lg">
          <Shield className="h-8 w-8 text-[var(--sun-400)]" />
        </div>
        <h3 className="font-display font-bold text-xl text-[var(--sand-200)]">
          Bank-Grade Security
        </h3>
        <p className="text-[var(--clay-400)] text-base leading-relaxed">
          Multi-signature protection and audited smart contracts
        </p>
      </div>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[var(--earth-700)] to-[var(--earth-800)] rounded-2xl border border-[rgba(245,242,237,0.2)]/20 shadow-lg">
          <Globe className="h-8 w-8 text-[var(--sun-400)]" />
        </div>
        <h3 className="font-display font-bold text-xl text-[var(--sand-200)]">
          Global Access
        </h3>
        <p className="text-[var(--clay-400)] text-base leading-relaxed">
          Cross-border transactions available 24/7 worldwide
        </p>
      </div>
    </div>
  );
};
