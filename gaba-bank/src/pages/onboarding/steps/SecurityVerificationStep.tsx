import React from "react";
import { Camera, Shield, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { useOnboarding } from "../../../contexts/OnboardingContext";
import { PhotoUpload } from "../components/PhotoUpload";

export const SecurityVerificationStep: React.FC = () => {
  const { data, updateSecurityVerification, nextStep, prevStep } =
    useOnboarding();

  const handlePhotoSelect = (file: File, preview: string) => {
    updateSecurityVerification({
      selfiePhoto: file,
      selfiePhotoPreview: preview,
    });
  };

  const handlePhotoRemove = () => {
    updateSecurityVerification({
      selfiePhoto: null,
      selfiePhotoPreview: "",
    });
  };

  const handleContinue = () => {
    if (data.securityVerification.selfiePhoto) {
      nextStep();
    }
  };

  const canContinue = !!data.securityVerification.selfiePhoto;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Verificação de Segurança</h2>
        <p className="text-muted-foreground">
          Tire uma selfie para confirmar sua identidade
        </p>
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Por que precisamos de uma selfie?</p>
          <p className="text-sm">
            Esta etapa garante que você é realmente a pessoa do documento
            enviado, aumentando a segurança da sua conta e prevenindo fraudes.
          </p>
        </AlertDescription>
      </Alert>

      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Instruções para a selfie:</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Olhe diretamente para a câmera</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Mantenha uma expressão neutra</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Use boa iluminação natural</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Remova óculos escuros ou chapéus</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Mantenha o rosto completamente visível</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Certifique-se de que a foto está nítida</p>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <PhotoUpload
        title="Sua Selfie"
        description="Tire uma foto do seu rosto para verificação de identidade"
        preview={data.securityVerification.selfiePhotoPreview}
        onPhotoSelect={handlePhotoSelect}
        onPhotoRemove={handlePhotoRemove}
        maxSize={5}
      />

      {/* Privacy and Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="text-sm font-medium">Proteção da sua privacidade:</p>
            <ul className="text-sm space-y-1 ml-4 list-disc">
              <li>Sua selfie é criptografada e armazenada com segurança</li>
              <li>Usamos apenas para verificação de identidade inicial</li>
              <li>Você pode solicitar a exclusão após a verificação</li>
              <li>Não compartilhamos suas fotos com terceiros</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Tips for better photo */}
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
            <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Dica: Use a câmera frontal do celular
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              A câmera frontal facilita o enquadramento e garante uma foto
              melhor para verificação.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={prevStep} size="lg">
          Voltar
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          size="lg"
          className="min-w-32"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
