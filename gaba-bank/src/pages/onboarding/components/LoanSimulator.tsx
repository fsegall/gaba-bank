import React from "react";
import { Calculator, Calendar, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";

interface LoanSimulatorProps {
  loanAmount: number;
  installments: number;
  interestRate: number; // monthly interest rate as decimal (e.g., 0.02 for 2%)
}

export const LoanSimulator: React.FC<LoanSimulatorProps> = ({
  loanAmount,
  installments,
  interestRate,
}) => {
  // Calculate monthly payment using PMT formula
  const monthlyPayment =
    (loanAmount * (interestRate * Math.pow(1 + interestRate, installments))) /
    (Math.pow(1 + interestRate, installments) - 1);

  const totalAmount = monthlyPayment * installments;
  const totalInterest = totalAmount - loanAmount;

  // Calculate next due date (assuming loan starts next month)
  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  nextDueDate.setDate(15); // 15th of next month

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Simulação do Empréstimo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loan Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Valor solicitado</p>
            <p className="text-2xl font-bold">{formatCurrency(loanAmount)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Parcelas</p>
            <p className="text-2xl font-bold">{installments}x</p>
          </div>
        </div>

        <Separator />

        {/* Payment Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-medium">Valor da parcela</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(monthlyPayment)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Primeira parcela</span>
            </div>
            <span className="text-sm font-medium">
              {formatDate(nextDueDate)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Taxa de juros mensal</span>
            <span className="text-sm font-medium">
              {(interestRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <Separator />

        {/* Total Summary */}
        <div className="bg-muted/50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Total a pagar</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Total de juros</span>
            <span className="font-medium">{formatCurrency(totalInterest)}</span>
          </div>
        </div>

        {/* Interest Rate Notice */}
        <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
            Taxa especial para comunidades quilombolas
          </p>
          <p className="text-amber-700 dark:text-amber-300">
            Nossa taxa de 2% ao mês é muito abaixo do mercado, criada
            especialmente para apoiar o empreendedorismo em comunidades
            quilombolas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
