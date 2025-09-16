import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Check, X } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { cn } from "../../../lib/utils";
import { useOnboarding } from "../../../contexts/OnboardingContext";
import {
  accountSecuritySchema,
  type AccountSecurityFormData,
} from "../../../lib/validations/onboarding";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

const getPasswordRequirements = (password: string): PasswordRequirement[] => [
  {
    label: "Pelo menos 8 caracteres",
    met: password.length >= 8,
  },
  {
    label: "Pelo menos 1 letra maiúscula",
    met: /[A-Z]/.test(password),
  },
  {
    label: "Pelo menos 1 letra minúscula",
    met: /[a-z]/.test(password),
  },
  {
    label: "Pelo menos 1 número",
    met: /\d/.test(password),
  },
];

const getPasswordStrength = (
  password: string,
): { level: number; label: string; color: string } => {
  const requirements = getPasswordRequirements(password);
  const metCount = requirements.filter((req) => req.met).length;

  if (metCount === 0) return { level: 0, label: "", color: "" };
  if (metCount <= 1) return { level: 1, label: "Fraca", color: "text-red-500" };
  if (metCount <= 2)
    return { level: 2, label: "Regular", color: "text-yellow-500" };
  if (metCount <= 3) return { level: 3, label: "Boa", color: "text-blue-500" };
  return { level: 4, label: "Forte", color: "text-green-500" };
};

export const PasswordCreationStep: React.FC = () => {
  const { data, updateAccountSecurity, nextStep, prevStep } = useOnboarding();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<AccountSecurityFormData>({
    resolver: zodResolver(accountSecuritySchema),
    defaultValues: {
      password: data.accountSecurity.password,
      confirmPassword: data.accountSecurity.confirmPassword,
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const requirements = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);

  const onSubmit = (formData: AccountSecurityFormData) => {
    updateAccountSecurity(formData);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Segurança da Conta</h2>
        <p className="text-muted-foreground">
          Crie uma senha forte para proteger sua conta
        </p>
      </div>

      {/* Security Notice */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm">
            Uma senha forte é essencial para proteger suas informações
            financeiras e pessoais. Siga as diretrizes abaixo para criar uma
            senha segura.
          </p>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha"
                      {...field}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Força da senha:</span>
                <span className={cn("text-sm font-medium", strength.color)}>
                  {strength.label}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    strength.level === 1 && "bg-red-500 w-1/4",
                    strength.level === 2 && "bg-yellow-500 w-2/4",
                    strength.level === 3 && "bg-blue-500 w-3/4",
                    strength.level === 4 && "bg-green-500 w-full",
                  )}
                />
              </div>
            </div>
          )}

          {/* Password Requirements */}
          {password && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Requisitos da senha:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    {requirement.met ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={cn(
                        requirement.met
                          ? "text-green-700 dark:text-green-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {requirement.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite novamente sua senha"
                      {...field}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar confirmação"
                          : "Mostrar confirmação"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>
                  Digite a mesma senha para confirmação
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Security Tips */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Dicas de segurança:
            </h4>
            <ul className="text-xs space-y-1 text-blue-700 dark:text-blue-300">
              <li>
                • Não use informações pessoais óbvias (nome, data de nascimento)
              </li>
              <li>• Evite sequências simples (123456, abcdef)</li>
              <li>• Use uma combinação única de letras, números e símbolos</li>
              <li>• Não compartilhe sua senha com outras pessoas</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={prevStep} size="lg">
              Voltar
            </Button>
            <Button type="submit" size="lg" className="min-w-32">
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
