import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../contexts/WalletContext";
import { HeroSection } from "./landing-page/HeroSection";
import { TrustIndicators } from "./landing-page/TrustIndicators";
import { HowItWorks } from "./landing-page/HowItWorks";
import { FinalCTA } from "./landing-page/FinalCTA";

export const LandingPage: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();

  // Navigate to home when wallet connects
  useEffect(() => {
    if (wallet.status === "connected") {
      navigate("/home");
    }
  }, [wallet.status, navigate]);

  return (
    <div className="space-y-24">
      <HeroSection />
      <TrustIndicators />
      <HowItWorks />
      <FinalCTA />
    </div>
  );
};
