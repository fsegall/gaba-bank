import React, { useRef, useState } from "react";
import { Upload, Camera, X, Check } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";

interface PhotoUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  preview?: string;
  onPhotoSelect: (file: File, preview: string) => void;
  onPhotoRemove: () => void;
  title: string;
  description: string;
  className?: string;
  disabled?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  accept = "image/*",
  maxSize = 5,
  preview,
  onPhotoSelect,
  onPhotoRemove,
  title,
  description,
  className,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`;
    }

    if (!file.type.startsWith("image/")) {
      return "Apenas arquivos de imagem são permitidos";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    setError("");

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onPhotoSelect(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center space-y-2">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {preview ? (
        <div className="relative">
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            <img
              src={preview}
              alt="Preview da foto enviada"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={openFileDialog}
                  disabled={disabled}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Trocar Foto
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onPhotoRemove}
                  disabled={disabled}
                >
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={openFileDialog}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Upload ${title.toLowerCase()}`}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              openFileDialog();
            }
          }}
        >
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">Clique para enviar ou arraste aqui</p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG até {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
};
