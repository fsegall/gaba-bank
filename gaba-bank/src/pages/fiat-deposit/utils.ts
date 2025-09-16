import { DepositStatus } from "./types";

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const generateReferenceCode = () => {
  return `SEP24-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
};

export const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export const getStatusColor = (status: DepositStatus) => {
  switch (status) {
    case "pending":
      return "bg-[var(--sun-500)]/10 text-[var(--sun-400)]";
    case "in_progress":
      return "bg-[var(--sun-500)]/10 text-[var(--sun-400)]";
    case "completed":
      return "bg-[var(--forest-500)]/10 text-[var(--forest-500)]";
    case "failed":
      return "bg-red-500/10 text-red-400";
    default:
      return "bg-[var(--clay-400)]/10 text-[var(--clay-400)]";
  }
};

export const getStatusText = (status: DepositStatus) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Idle";
  }
};
