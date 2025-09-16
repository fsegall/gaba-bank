import { z } from "zod";

// CPF validation function
const validateCPF = (cpf: string): boolean => {
  // Remove any non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, "");

  // Check if it has 11 digits
  if (cleanCPF.length !== 11) return false;

  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

  return true;
};

// Brazilian phone validation
const validateBrazilianPhone = (phone: string): boolean => {
  // Remove any non-numeric characters
  const cleanPhone = phone.replace(/\D/g, "");

  // Check if it has 10 or 11 digits (with or without 9th digit for mobile)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;

  // Check if it starts with valid area codes (11-99)
  const areaCode = parseInt(cleanPhone.substring(0, 2));
  if (areaCode < 11 || areaCode > 99) return false;

  return true;
};

// Password strength validation
const validatePasswordStrength = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
};

export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),

  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine(validateCPF, "CPF inválido"),

  dateOfBirth: z
    .date({
      required_error: "Data de nascimento é obrigatória",
      invalid_type_error: "Data de nascimento inválida",
    })
    .refine((date) => {
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 18 && age <= 100;
    }, "Você deve ter entre 18 e 100 anos"),

  phone: z
    .string()
    .min(1, "Telefone é obrigatório")
    .refine(validateBrazilianPhone, "Telefone brasileiro inválido"),
});

export const accountSecuritySchema = z
  .object({
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .refine(
        validatePasswordStrength,
        "Senha deve conter pelo menos: 8 caracteres, 1 maiúscula, 1 minúscula e 1 número",
      ),

    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

export const creditApplicationSchema = z.object({
  loanAmount: z
    .number()
    .min(500, "Valor mínimo do empréstimo é R$ 500")
    .max(10000, "Valor máximo do empréstimo é R$ 10.000"),

  installments: z
    .number()
    .min(6, "Mínimo de 6 parcelas")
    .max(24, "Máximo de 24 parcelas"),

  creditPurpose: z
    .string()
    .min(10, "Descreva o propósito do crédito com pelo menos 10 caracteres")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
});

export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AccountSecurityFormData = z.infer<typeof accountSecuritySchema>;
export type CreditApplicationFormData = z.infer<typeof creditApplicationSchema>;
