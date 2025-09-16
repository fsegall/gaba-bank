import React, { JSX } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { ArrowUpDown, ExternalLink, AlertTriangle } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

export const RecentSwaps: React.FC = () => {
  const { swapHistory } = useWallet();

  const getTokenIcon = (symbol: string) => {
    const iconMap: Record<string, JSX.Element> = {
      BRLD: (
        <div className="h-5 w-5 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">B</span>
        </div>
      ),
      USDC: (
        <div className="relative h-5 w-5">
          <img
            src="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
            alt="USDC"
            className="h-5 w-5 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="hidden h-5 w-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full items-center justify-center">
            <span className="text-xs text-white font-bold">U</span>
          </div>
        </div>
      ),
      TDAO: (
        <div className="h-5 w-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">T</span>
        </div>
      ),
      SOL: (
        <div className="relative h-5 w-5">
          <img
            src="https://assets.coingecko.com/coins/images/4128/small/solana.png"
            alt="SOL"
            className="h-5 w-5 rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div className="hidden h-5 w-5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full items-center justify-center">
            <span className="text-xs text-white font-bold">S</span>
          </div>
        </div>
      ),
      PIX: (
        <div className="h-5 w-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">P</span>
        </div>
      ),
    };
    return (
      iconMap[symbol] || (
        <div className="h-5 w-5 bg-gray-500 rounded-full flex items-center justify-center">
          <span className="text-xs text-white font-bold">{symbol[0]}</span>
        </div>
      )
    );
  };

  return (
    <div className="lg:col-span-2 space-y-8">
      <Card className="bg-[var(--earth-700)]/60 border border-[rgba(245,242,237,0.1)] rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[var(--sand-200)] text-lg font-semibold">
            Recent Swaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {swapHistory.length === 0 ? (
              <p className="text-[var(--clay-400)] text-center py-4">
                Your recent swaps will appear here.
              </p>
            ) : (
              swapHistory.slice(0, 5).map((swap) => (
                <div
                  key={swap.id}
                  className="flex items-center justify-between p-3 bg-[var(--earth-800)]/50 hover:bg-[var(--earth-800)] rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div className="p-1 bg-[var(--earth-700)] rounded-full">
                        {getTokenIcon(swap.fromToken)}
                      </div>
                      <ArrowUpDown className="h-3 w-3 text-[var(--clay-400)]" />
                      <div className="p-1 bg-[var(--earth-700)] rounded-full">
                        {getTokenIcon(swap.toToken)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--sand-200)] text-sm font-medium">
                        {swap.fromAmount} {swap.fromToken} → {swap.toAmount}{" "}
                        {swap.toToken}
                      </div>
                      <div className="text-[var(--clay-400)] text-xs">
                        {swap.timestamp}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-[var(--sun-400)] hover:text-[var(--sun-500)]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      <Alert className="border-amber-500/20 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-amber-200">
          <strong>Price Slippage Warning:</strong> Prices may change on the
          testnet between submission and execution.
        </AlertDescription>
      </Alert>
    </div>
  );
};
