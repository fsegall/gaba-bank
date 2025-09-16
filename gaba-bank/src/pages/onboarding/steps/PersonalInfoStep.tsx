import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import { useOnboarding } from "../../../contexts/OnboardingContext";
import {
  personalInfoSchema,
  type PersonalInfoFormData,
} from "../../../lib/validations/onboarding";

// Utility functions for formatting
const formatCPF = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const formatPhone = (value: string): string => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  } else {
    return cleanValue
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }
};

export const PersonalInfoStep: React.FC = () => {
  const { data, updatePersonalInfo, nextStep } = useOnboarding();

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: data.personalInfo.fullName,
      cpf: data.personalInfo.cpf,
      dateOfBirth: data.personalInfo.dateOfBirth || undefined,
      phone: data.personalInfo.phone,
    },
  });

  const onSubmit = (formData: PersonalInfoFormData) => {
    updatePersonalInfo(formData);
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Informações Pessoais</h2>
        <p className="text-muted-foreground">
          Vamos começar com algumas informações básicas sobre você
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite seu nome completo"
                    {...field}
                    autoComplete="name"
                  />
                </FormControl>
                <FormDescription>
                  Digite seu nome completo como aparece no seu documento de
                  identidade
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    value={formatCPF(value)}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={14}
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Seu CPF será usado para verificação de identidade
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      const date = e.target.value
                        ? new Date(e.target.value)
                        : null;
                      field.onChange(date);
                    }}
                    max={format(new Date(), "yyyy-MM-dd")}
                    min="1900-01-01"
                    className="w-full"
                  />
                </FormControl>
                <FormDescription>
                  Você deve ter pelo menos 18 anos para criar uma conta
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={formatPhone(value)}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={15}
                    autoComplete="tel"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Seu telefone será usado para confirmações de segurança
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-6">
            <Button type="submit" size="lg" className="min-w-32">
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
