import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="container flex flex-col md:flex-row items-center justify-evenly mx-auto p-6 text-center text-[10px] md:text-sm text-chart-4 text-pretty">
        <p>
          This is a testing environment on the Stellar TESTNET.{" "}
          <span className="text-primary">Do not use real funds</span>.
        </p>
        <div className="flex justify-center gap-6 mt-3 md:mt-0">
          <button
            type="button"
            className="text-primary hover:font-semibold transition-colors"
          >
            Docs
          </button>
          <button
            type="button"
            className="text-primary hover:font-semibold transition-colors"
          >
            Explorer
          </button>
        </div>
      </div>
    </footer>
  );
};
