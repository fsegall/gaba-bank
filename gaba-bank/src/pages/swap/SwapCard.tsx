import React, { JSX } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ArrowUpDown, Clock, ChevronDown } from "lucide-react";
import { useWallet } from "../../contexts/WalletContext";

interface SwapCardProps {
  sellAmount: string;
  setSellAmount: (amount: string) => void;
  sellToken: string;
  setSellToken: (token: string) => void;
  receiveToken: string;
  setReceiveToken: (token: string) => void;
  receiveAmount: string;
  handleSwap: () => void;
}

export const SwapCard: React.FC<SwapCardProps> = ({
  sellAmount,
  setSellAmount,
  sellToken,
  setSellToken,
  receiveToken,
  setReceiveToken,
  receiveAmount,
  handleSwap,
}) => {
  const { wallet, getSwapRate, isSwapping } = useWallet();
  const tokens = ["BRLD", "USDC", "TDAO", "SOL", "PIX"];

  const swapTokens = () => {
    const tempToken = sellToken;
    setSellToken(receiveToken);
    setReceiveToken(tempToken);
  };

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

  const currentRate = getSwapRate(sellToken, receiveToken);

  return (
    <div className="lg:col-span-3">
      <div className="group relative flex flex-col bg-gradient-to-br from-[var(--earth-700)]/80 to-[var(--earth-800)]/80 backdrop-blur-xl border border-[rgba(245,242,237,0.15)]/30 p-6 md:p-8 rounded-3xl transition-all duration-500 min-h-[500px]">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--sun-500)]/0 via-[var(--sun-500)]/8 to-[var(--sun-500)]/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl" />
        <div className="relative z-10 flex flex-col h-full space-y-6">
          <div className="bg-[var(--earth-800)]/60 border border-transparent focus-within:border-[var(--sun-500)]/20 rounded-xl p-4 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--clay-400)]">From</span>
              <span className="text-sm text-[var(--clay-400)]">
                Balance:{" "}
                {wallet.balances[
                  sellToken as keyof typeof wallet.balances
                ]?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                placeholder="0.0"
                className="bg-transparent border-none !text-3xl text-[var(--sand-200)] font-semibold w-fit p-0 h-fit focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Select value={sellToken} onValueChange={setSellToken}>
                <SelectTrigger className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[var(--earth-700)] border-[var(--earth-600)]">
                  {tokens.map((token) => (
                    <SelectItem
                      key={token}
                      value={token}
                      className="text-[var(--sand-200)]"
                    >
                      <div className="flex items-center space-x-2">
                        {getTokenIcon(token)}
                        <span>{token}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-center -my-8 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={swapTokens}
              className="rounded-full bg-[var(--earth-900)] border border-[rgba(245,242,237,0.15)]/30 hover:bg-[var(--earth-900)]/70 transition-all duration-300 group-hover:scale-110 w-fit h-fit p-4 backdrop-blur-xl"
            >
              <ArrowUpDown className="text-[var(--sun-400)]" />
            </Button>
          </div>
          <div className="bg-[var(--earth-800)]/60 border border-transparent rounded-xl p-4 mt-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--clay-400)]">To</span>
              <span className="text-sm text-[var(--clay-400)]">
                Balance:{" "}
                {wallet.balances[
                  receiveToken as keyof typeof wallet.balances
                ]?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-3xl text-[var(--sand-200)] font-semibold truncate">
                {receiveAmount || "0.0"}
              </div>
              <Select value={receiveToken} onValueChange={setReceiveToken}>
                <SelectTrigger className="font-semibold">
                  <div className="flex items-center space-x-2">
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[var(--earth-700)] border-[var(--earth-600)]/20">
                  {tokens.map((token) => (
                    <SelectItem
                      key={token}
                      value={token}
                      className="text-[var(--sand-200)]"
                    >
                      <div className="flex items-center space-x-2">
                        {getTokenIcon(token)}
                        <span>{token}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-[var(--earth-900)]/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-[var(--clay-400)]">
                <Clock className="h-4 w-4" />
                <span>
                  1 {sellToken} = {currentRate.toFixed(6)} {receiveToken}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--clay-400)]" />
            </div>
            {sellAmount && receiveAmount && (
              <div className="space-y-2 pt-2 border-t border-[var(--earth-600)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--clay-400)]">
                    Expected Output
                  </span>
                  <span className="text-[var(--sand-200)]">
                    {receiveAmount} {receiveToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--clay-400)]">Price Impact</span>
                  <span className="text-green-400">{"<0.01%"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--clay-400)]">
                    Minimum received
                  </span>
                  <span className="text-[var(--sand-200)]">
                    {(Number(receiveAmount) * 0.995).toFixed(6)} {receiveToken}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--clay-400)]">
                    Slippage Tolerance
                  </span>
                  <span className="text-[var(--sun-400)]">0.5%</span>
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={handleSwap}
            disabled={
              !sellAmount || isSwapping || wallet.status !== "connected"
            }
            size="lg"
            className="w-full bg-gradient-to-r from-[var(--sun-500)] to-[var(--sun-400)] hover:from-[var(--sun-600)] hover:to-[var(--sun-500)] text-[var(--earth-800)] py-7 text-xl font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSwapping
              ? "Swapping..."
              : wallet.status !== "connected"
                ? "Connect Wallet"
                : "Swap"}
          </Button>
        </div>
      </div>
    </div>
  );
};
