import React from "react";
import { Card, CardContent } from "../../components/ui/card";
import { TrendingUp, DollarSign, Users } from "lucide-react";

interface VaultMetrics {
  pps: number;
  tvl: number;
  totalShares: number;
  isLoading: boolean;
}

interface KpiTilesProps {
  metrics: VaultMetrics;
}

const SkeletonTile = () => (
  <Card className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl">
    <CardContent className="p-6">
      <div className="space-y-3">
        <div className="h-4 bg-[var(--clay-400)]/20 rounded animate-pulse" />
        <div className="h-8 bg-[var(--clay-400)]/20 rounded animate-pulse" />
        <div className="h-3 bg-[var(--clay-400)]/20 rounded w-1/2 animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const KpiTiles: React.FC<KpiTilesProps> = ({ metrics }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {metrics.isLoading ? (
      <>
        <SkeletonTile />
        <SkeletonTile />
        <SkeletonTile />
      </>
    ) : (
      <>
        <Card className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-[var(--sun-400)]" />
              <span className="text-[var(--clay-400)] font-medium">
                Price per Share
              </span>
            </div>
            <div className="text-3xl font-bold text-[var(--sand-200)]">
              ${metrics.pps.toFixed(4)}
            </div>
            <div className="text-xs text-[var(--clay-400)] mt-1">
              Updated just now
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-[var(--forest-500)]" />
              <span className="text-[var(--clay-400)] font-medium">
                Total Assets
              </span>
            </div>
            <div className="text-3xl font-bold text-[var(--sand-200)]">
              {formatCurrency(metrics.tvl)}
            </div>
            <div className="text-xs text-[var(--clay-400)] mt-1">
              Updated just now
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-[var(--river-500)]" />
              <span className="text-[var(--clay-400)] font-medium">
                Total Shares
              </span>
            </div>
            <div className="text-3xl font-bold text-[var(--sand-200)]">
              {metrics.totalShares.toLocaleString()}
            </div>
            <div className="text-xs text-[var(--clay-400)] mt-1">
              Updated just now
            </div>
          </CardContent>
        </Card>
      </>
    )}
  </div>
);
