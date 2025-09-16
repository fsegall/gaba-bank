// Types for fiat deposit flow
export type DepositStatus =
  | "idle"
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

export interface FiatDepositTransaction {
  id: string;
  amount: number;
  currency: string;
  status: DepositStatus;
  referenceCode: string;
  LandmarkName: string;
  lastUpdated: Date;
  completedAt?: Date;
  failureReason?: string;
}
