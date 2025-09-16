import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { DollarSign, Users, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Slider } from "../../../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
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
import { useOnboarding } from "../../../contexts/OnboardingContext";
import {
  creditApplicationSchema,
  type CreditApplicationFormData,
} from "../../../lib/validations/onboarding";
import { LoanSimulator } from "../components/LoanSimulator";

const installmentOptions = [
  { value: 6, label: "6 parcelas" },
  { value: 12, label: "12 parcelas" },
  { value: 18, label: "18 parcelas" },
  { value: 24, label: "24 parcelas" },
];

export const CreditApplicationStep: React.FC = () => {
  const navigate = useNavigate();
  const { data, updateCreditApplication, submitApplication } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<CreditApplicationFormData>({
    resolver: zodResolver(creditApplicationSchema),
    defaultValues: {
      loanAmount: data.creditApplication.loanAmount,
      installments: data.creditApplication.installments,
      creditPurpose: data.creditApplication.creditPurpose,
    },
    mode: "onChange",
  });

  const loanAmount = form.watch("loanAmount");
  const installments = form.watch("installments");

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const onSubmit = async (formData: CreditApplicationFormData) => {
    updateCreditApplication(formData);
    setIsSubmitting(true);

    try {
      await submitApplication();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      // Handle error appropriately
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToCrowdfunding = () => {
    navigate("/crowdfunding");
  };

  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
            Solicitação Enviada com Sucesso!
          </h2>
          <p className="text-muted-foreground">
            Sua solicitação de crédito foi enviada para análise da comunidade
          </p>
        </div>

        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Próximos passos:</p>
              <ul className="text-sm space-y-1 ml-4 list-disc">
                <li>
                  Sua solicitação entrará em período de avaliação comunitária (7
                  dias)
                </li>
                <li>
                  Membros da comunidade poderão revisar e votar em sua proposta
                </li>
                <li>Você receberá notificações sobre o progresso da votação</li>
                <li>
                  Se aprovado, o crédito será liberado em até 2 dias úteis
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Resumo da sua solicitação:</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Valor:</span>
              <span className="font-medium">
                {formatCurrency(data.creditApplication.loanAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Parcelas:</span>
              <span className="font-medium">
                {data.creditApplication.installments}x
              </span>
            </div>
            <div className="flex justify-between">
              <span>Finalidade:</span>
              <span className="font-medium">
                {data.creditApplication.creditPurpose.substring(0, 50)}...
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleGoToCrowdfunding} size="lg" className="w-full">
            Acompanhar Solicitação
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            size="lg"
            className="w-full"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Solicitação de Crédito</h2>
        <p className="text-muted-foreground">
          Defina o valor, prazo e finalidade do seu empréstimo
        </p>
      </div>

      {/* Community Notice */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm">
            Sua solicitação será avaliada pela comunidade quilombola. Seja
            transparente sobre a finalidade do crédito para aumentar suas
            chances de aprovação.
          </p>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="loanAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Empréstimo</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Slider
                      min={500}
                      max={10000}
                      step={100}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
                    />
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min={500}
                        max={10000}
                        step={100}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 500)
                        }
                        className="w-32"
                      />
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(field.value)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mín: R$ 500</span>
                      <span>Máx: R$ 10.000</span>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Escolha o valor que melhor atende às suas necessidades
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="installments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Parcelas</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o número de parcelas" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {installmentOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Parcelas mais longas reduzem o valor mensal, mas aumentam o
                  total de juros
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Loan Simulation */}
          <LoanSimulator
            loanAmount={loanAmount}
            installments={installments}
            interestRate={0.02} // 2% monthly
          />

          <FormField
            control={form.control}
            name="creditPurpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Finalidade do Crédito</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva como você pretende usar este empréstimo. Seja específico sobre seu negócio ou projeto..."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Explique detalhadamente como o crédito será usado. Isso ajuda
                  a comunidade a entender e apoiar sua solicitação.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terms and Conditions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Termos e Condições:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Taxa de juros: 2% ao mês (24% ao ano)</li>
              <li>• Pagamento: débito automático no dia 15 de cada mês</li>
              <li>• Sem cobrança de taxas adicionais ou multas abusivas</li>
              <li>• Possibilidade de quitação antecipada com desconto</li>
              <li>• Suporte financeiro e mentoria da comunidade</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              size="lg"
              disabled={isSubmitting}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="min-w-32"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Solicitar Crédito
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
