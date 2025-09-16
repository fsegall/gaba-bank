import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useOnboarding } from "../../../contexts/OnboardingContext";
import { StepIndicator } from "./StepIndicator";
import { PersonalInfoStep } from "../steps/PersonalInfoStep";
import { IdentityVerificationStep } from "../steps/IdentityVerificationStep";
import { SecurityVerificationStep } from "../steps/SecurityVerificationStep";
import { PasswordCreationStep } from "../steps/PasswordCreationStep";
import { CreditApplicationStep } from "../steps/CreditApplicationStep";

export const OnboardingLayout: React.FC = () => {
  const navigate = useNavigate();
  const { currentStep, prevStep } = useOnboarding();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep />;
      case 2:
        return <IdentityVerificationStep />;
      case 3:
        return <SecurityVerificationStep />;
      case 4:
        return <PasswordCreationStep />;
      case 5:
        return <CreditApplicationStep />;
      default:
        return <PersonalInfoStep />;
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate("/");
    } else {
      prevStep();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="flex items-center gap-2"
              aria-label={
                currentStep === 1
                  ? "Voltar para página inicial"
                  : "Voltar para etapa anterior"
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="text-sm text-muted-foreground">
              Etapa {currentStep} de 5
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator />
        </div>

        {/* Step Content */}
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8">{renderCurrentStep()}</CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda? Entre em contato conosco através do{" "}
            <a
              href="mailto:suporte@gababank.com"
              className="text-primary hover:underline focus:underline focus:outline-none"
            >
              suporte@gababank.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
