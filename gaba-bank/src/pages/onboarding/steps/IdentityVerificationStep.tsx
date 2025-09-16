import React from "react";
import { FileText, Shield, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { useOnboarding } from "../../../contexts/OnboardingContext";
import { PhotoUpload } from "../components/PhotoUpload";

export const IdentityVerificationStep: React.FC = () => {
  const { data, updateIdentityVerification, nextStep, prevStep } =
    useOnboarding();

  const handlePhotoSelect = (file: File, preview: string) => {
    updateIdentityVerification({
      idPhoto: file,
      idPhotoPreview: preview,
    });
  };

  const handlePhotoRemove = () => {
    updateIdentityVerification({
      idPhoto: null,
      idPhotoPreview: "",
    });
  };

  const handleContinue = () => {
    if (data.identityVerification.idPhoto) {
      nextStep();
    }
  };

  const canContinue = !!data.identityVerification.idPhoto;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Verificação de Identidade</h2>
        <p className="text-muted-foreground">
          Envie uma foto clara do seu documento de identidade
        </p>
      </div>

      {/* Instructions */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="font-medium">Dicas para uma boa foto:</p>
          <ul className="text-sm space-y-1 ml-4 list-disc">
            <li>Certifique-se de que toda a informação está visível</li>
            <li>Use boa iluminação, evite sombras</li>
            <li>Mantenha o documento reto e sem reflexos</li>
            <li>A foto deve estar nítida e legível</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Accepted Documents */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Documentos aceitos:</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium">RG (Carteira de Identidade)</p>
            <p className="text-muted-foreground">Frente e verso em uma foto</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">CNH (Carteira de Motorista)</p>
            <p className="text-muted-foreground">Frente e verso em uma foto</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Passaporte</p>
            <p className="text-muted-foreground">Página com foto e dados</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">Carteira de Trabalho</p>
            <p className="text-muted-foreground">Página com foto e dados</p>
          </div>
        </div>
      </div>

      {/* Photo Upload */}
      <PhotoUpload
        title="Foto do Documento"
        description="Envie uma foto clara do seu documento de identidade"
        preview={data.identityVerification.idPhotoPreview}
        onPhotoSelect={handlePhotoSelect}
        onPhotoRemove={handlePhotoRemove}
        maxSize={5}
      />

      {/* Privacy Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm">
            <strong>Proteção de dados:</strong> Suas informações são
            criptografadas e usadas apenas para verificação de identidade,
            conforme nossa política de privacidade.
          </p>
        </AlertDescription>
      </Alert>

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
