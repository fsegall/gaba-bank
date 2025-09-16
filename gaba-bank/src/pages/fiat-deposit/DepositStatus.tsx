import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  FiatDepositTransaction,
  DepositStatus as DepositStatusType,
} from "./types";
import {
  formatCurrency,
  formatTimeAgo,
  getStatusColor,
  getStatusText,
} from "./utils";

interface DepositStatusProps {
  transaction: FiatDepositTransaction;
  onRetry: () => void;
}

const getStatusIcon = (status: DepositStatusType) => {
  switch (status) {
    case "pending":
      return <Clock className="h-5 w-5 text-[var(--sun-400)]" />;
    case "in_progress":
      return <Loader2 className="h-5 w-5 text-[var(--sun-400)] animate-spin" />;
    case "completed":
      return <CheckCircle className="h-5 w-5 text-[var(--forest-500)]" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Clock className="h-5 w-5 text-[var(--clay-400)]" />;
  }
};

export const DepositStatus: React.FC<DepositStatusProps> = ({
  transaction,
  onRetry,
}) => {
  return (
    <Card className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[var(--sand-200)]">
          <div className="flex items-center gap-3">
            {getStatusIcon(transaction.status)}
            Deposit Status
          </div>
          <Badge className={getStatusColor(transaction.status)}>
            {getStatusText(transaction.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-[var(--clay-400)] mb-1">Amount</div>
            <div className="font-mono text-[var(--sand-200)]">
              {formatCurrency(transaction.amount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--clay-400)] mb-1">Reference</div>
            <div className="font-mono text-xs text-[var(--sand-200)]">
              {transaction.referenceCode}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--clay-400)]">Landmark</span>
            <span className="text-[var(--sand-200)]">
              {transaction.LandmarkName}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--clay-400)]">Last Updated</span>
            <span className="text-[var(--sand-200)]">
              {formatTimeAgo(transaction.lastUpdated)}
            </span>
          </div>
          {transaction.completedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--clay-400)]">Completed</span>
              <span className="text-[var(--forest-500)]">
                {formatTimeAgo(transaction.completedAt)}
              </span>
            </div>
          )}
        </div>

        {transaction.status === "failed" && transaction.failureReason && (
          <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Deposit Failed:</strong> {transaction.failureReason}
            </AlertDescription>
          </Alert>
        )}

        {transaction.status === "failed" && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="w-full border-[rgba(245,242,237,0.2)] text-[var(--sand-200)] hover:bg-[var(--earth-600)]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
