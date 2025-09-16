import React from "react";
import { Check, User, FileImage, Shield, Lock, CreditCard } from "lucide-react";
import { cn } from "../../../lib/utils";
import { useOnboarding } from "../../../contexts/OnboardingContext";

const steps = [
  {
    number: 1,
    title: "Informações Pessoais",
    description: "Nome, CPF e contatos",
    icon: User,
  },
  {
    number: 2,
    title: "Verificação de Identidade",
    description: "Foto do documento",
    icon: FileImage,
  },
  {
    number: 3,
    title: "Verificação de Segurança",
    description: "Selfie para confirmação",
    icon: Shield,
  },
  {
    number: 4,
    title: "Segurança da Conta",
    description: "Criação de senha",
    icon: Lock,
  },
  {
    number: 5,
    title: "Solicitação de Crédito",
    description: "Valor e finalidade",
    icon: CreditCard,
  },
];

export const StepIndicator: React.FC = () => {
  const { currentStep, isStepCompleted, canProceedToStep, goToStep } =
    useOnboarding();

  return (
    <nav aria-label="Progresso do cadastro" className="w-full">
      <ol className="flex items-center justify-between space-x-4 md:space-x-8">
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = isStepCompleted(step.number);
          const canProceed = canProceedToStep(step.number);
          const Icon = step.icon;

          return (
            <li key={step.number} className="flex-1">
              <button
                onClick={() => canProceed && goToStep(step.number)}
                disabled={!canProceed}
                className={cn(
                  "w-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
                  canProceed ? "cursor-pointer" : "cursor-not-allowed",
                )}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.title}: ${step.description}${isCompleted ? " - Concluída" : ""}${isActive ? " - Atual" : ""}`}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border-2 transition-all duration-200",
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : canProceed
                            ? "border-muted-foreground/30 bg-muted text-muted-foreground group-hover:border-primary/50 group-hover:bg-primary/5"
                            : "border-muted-foreground/20 bg-muted/50 text-muted-foreground/50",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 md:h-6 md:w-6" />
                    ) : (
                      <Icon className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="min-h-[3rem] md:min-h-[3.5rem]">
                    <p
                      className={cn(
                        "text-xs md:text-sm font-medium transition-colors duration-200",
                        isActive
                          ? "text-primary"
                          : isCompleted
                            ? "text-foreground"
                            : canProceed
                              ? "text-muted-foreground group-hover:text-foreground"
                              : "text-muted-foreground/60",
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={cn(
                        "text-xs text-muted-foreground mt-1 hidden md:block",
                        !canProceed && "text-muted-foreground/60",
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </button>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 translate-x-6">
                  <div
                    className={cn(
                      "h-full transition-colors duration-200",
                      isCompleted ? "bg-primary" : "bg-muted-foreground/20",
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile Progress Bar */}
      <div className="mt-4 md:hidden">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(currentStep / steps.length) * 100}%`,
            }}
            role="progressbar"
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`Progresso: ${currentStep} de ${steps.length} etapas concluídas`}
          />
        </div>
      </div>
    </nav>
  );
};
