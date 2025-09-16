import React, { useState, useEffect } from "react";
import { useWallet } from "../contexts/WalletContext";
import { SwapHeader } from "./swap/SwapHeader";
import { SwapCard } from "./swap/SwapCard";
import { RecentSwaps } from "./swap/RecentSwaps";
import { EducationSection } from "./swap/EducationSection";

export const Swap: React.FC = () => {
  const { executeSwap, getSwapRate } = useWallet();

  const [sellAmount, setSellAmount] = useState("");
  const [sellToken, setSellToken] = useState("BRLD");
  const [receiveToken, setReceiveToken] = useState("USDC");
  const [receiveAmount, setReceiveAmount] = useState("");

  useEffect(() => {
    if (sellAmount && !isNaN(Number(sellAmount))) {
      const rate = getSwapRate(sellToken, receiveToken);
      const calculated = (Number(sellAmount) * rate).toFixed(6);
      setReceiveAmount(calculated);
    } else {
      setReceiveAmount("");
    }
  }, [sellAmount, sellToken, receiveToken, getSwapRate]);

  const handleSwap = async () => {
    if (!sellAmount || isNaN(Number(sellAmount))) return;
    try {
      await executeSwap(sellToken, receiveToken, Number(sellAmount));
      setSellAmount("");
      setReceiveAmount("");
    } catch (error) {
      console.error("Swap failed:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <SwapHeader />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <SwapCard
          sellAmount={sellAmount}
          setSellAmount={setSellAmount}
          sellToken={sellToken}
          setSellToken={setSellToken}
          receiveToken={receiveToken}
          setReceiveToken={setReceiveToken}
          receiveAmount={receiveAmount}
          setReceiveAmount={setReceiveAmount}
          handleSwap={handleSwap}
        />
        <RecentSwaps />
      </div>
      <EducationSection />
    </div>
  );
};
