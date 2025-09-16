import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { onboardingStorage } from "../lib/storage";

export interface PersonalInfo {
  fullName: string;
  cpf: string;
  dateOfBirth: Date | null;
  phone: string;
}

export interface IdentityVerification {
  idPhoto: File | null;
  idPhotoPreview: string;
}

export interface SecurityVerification {
  selfiePhoto: File | null;
  selfiePhotoPreview: string;
}

export interface AccountSecurity {
  password: string;
  confirmPassword: string;
}

export interface CreditApplication {
  loanAmount: number;
  installments: number;
  creditPurpose: string;
}

export interface OnboardingData {
  personalInfo: PersonalInfo;
  identityVerification: IdentityVerification;
  securityVerification: SecurityVerification;
  accountSecurity: AccountSecurity;
  creditApplication: CreditApplication;
}

export interface OnboardingContextType {
  currentStep: number;
  data: OnboardingData;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateIdentityVerification: (
    verification: Partial<IdentityVerification>,
  ) => void;
  updateSecurityVerification: (
    verification: Partial<SecurityVerification>,
  ) => void;
  updateAccountSecurity: (security: Partial<AccountSecurity>) => void;
  updateCreditApplication: (application: Partial<CreditApplication>) => void;
  isStepCompleted: (step: number) => boolean;
  canProceedToStep: (step: number) => boolean;
  submitApplication: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

// Helper function to check if a step is completed for given data
const isStepCompletedForData = (
  step: number,
  data: OnboardingData,
): boolean => {
  switch (step) {
    case 1:
      return !!(
        data.personalInfo.fullName &&
        data.personalInfo.cpf &&
        data.personalInfo.dateOfBirth &&
        data.personalInfo.phone
      );
    case 2:
      return !!data.identityVerification.idPhoto;
    case 3:
      return !!data.securityVerification.selfiePhoto;
    case 4:
      return !!(
        data.accountSecurity.password &&
        data.accountSecurity.confirmPassword &&
        data.accountSecurity.password === data.accountSecurity.confirmPassword
      );
    case 5:
      return !!(
        data.creditApplication.loanAmount > 0 &&
        data.creditApplication.installments > 0 &&
        data.creditApplication.creditPurpose.trim()
      );
    default:
      return false;
  }
};

const initialData: OnboardingData = {
  personalInfo: {
    fullName: "",
    cpf: "",
    dateOfBirth: null,
    phone: "",
  },
  identityVerification: {
    idPhoto: null,
    idPhotoPreview: "",
  },
  securityVerification: {
    selfiePhoto: null,
    selfiePhotoPreview: "",
  },
  accountSecurity: {
    password: "",
    confirmPassword: "",
  },
  creditApplication: {
    loanAmount: 5000,
    installments: 12,
    creditPurpose: "",
  },
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const totalSteps = 5;

  // Load saved data on mount
  useEffect(() => {
    const savedData = onboardingStorage.load();
    if (savedData) {
      setData(savedData);
      // Also restore the current step based on completed steps
      for (let step = totalSteps; step >= 1; step--) {
        if (isStepCompletedForData(step, savedData)) {
          setCurrentStep(Math.min(step + 1, totalSteps));
          break;
        }
      }
    }
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    onboardingStorage.save(data);
  }, [data]);

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps && canProceedToStep(step)) {
      setCurrentStep(step);
    }
  };

  const updatePersonalInfo = (info: Partial<PersonalInfo>) => {
    setData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info },
    }));
  };

  const updateIdentityVerification = (
    verification: Partial<IdentityVerification>,
  ) => {
    setData((prev) => ({
      ...prev,
      identityVerification: { ...prev.identityVerification, ...verification },
    }));
  };

  const updateSecurityVerification = (
    verification: Partial<SecurityVerification>,
  ) => {
    setData((prev) => ({
      ...prev,
      securityVerification: { ...prev.securityVerification, ...verification },
    }));
  };

  const updateAccountSecurity = (security: Partial<AccountSecurity>) => {
    setData((prev) => ({
      ...prev,
      accountSecurity: { ...prev.accountSecurity, ...security },
    }));
  };

  const updateCreditApplication = (application: Partial<CreditApplication>) => {
    setData((prev) => ({
      ...prev,
      creditApplication: { ...prev.creditApplication, ...application },
    }));
  };

  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          data.personalInfo.fullName &&
          data.personalInfo.cpf &&
          data.personalInfo.dateOfBirth &&
          data.personalInfo.phone
        );
      case 2:
        return !!data.identityVerification.idPhoto;
      case 3:
        return !!data.securityVerification.selfiePhoto;
      case 4:
        return !!(
          data.accountSecurity.password &&
          data.accountSecurity.confirmPassword &&
          data.accountSecurity.password === data.accountSecurity.confirmPassword
        );
      case 5:
        return !!(
          data.creditApplication.loanAmount > 0 &&
          data.creditApplication.installments > 0 &&
          data.creditApplication.creditPurpose.trim()
        );
      default:
        return false;
    }
  };

  const canProceedToStep = (step: number): boolean => {
    if (step === 1) return true;

    for (let i = 1; i < step; i++) {
      if (!isStepCompleted(i)) {
        return false;
      }
    }
    return true;
  };

  const submitApplication = async (): Promise<void> => {
    // Here you would typically submit the data to your backend
    console.log("Submitting application:", data);

    // Simulate API submission
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 2000);
    });

    // Clear onboarding data after successful submission
    onboardingStorage.clear();
    setData(initialData);
    setCurrentStep(1);
  };

  const value: OnboardingContextType = {
    currentStep,
    data,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    updatePersonalInfo,
    updateIdentityVerification,
    updateSecurityVerification,
    updateAccountSecurity,
    updateCreditApplication,
    isStepCompleted,
    canProceedToStep,
    submitApplication,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
