import React from "react";
import { OnboardingProvider } from "../contexts/OnboardingContext";
import { OnboardingLayout } from "./onboarding/components/OnboardingLayout";

export const OnboardingPage: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingLayout />
    </OnboardingProvider>
  );
};
