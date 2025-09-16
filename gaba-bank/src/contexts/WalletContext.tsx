import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { walletStorage } from "../lib/storage";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface WalletState {
  status: WalletStatus;
  address: string;
  balances: {
    BRLD: number;
    USDC: number;
    TDAO: number;
    SOL: number;
    PIX: number;
  };
}

export interface VaultPool {
  id: number;
  name: string;
  apy: string;
  tvl: number;
  userBalance: number;
  assets: string[];
}

export interface ActivityRecord {
  time: string;
  type: string;
  icon: string;
  amount: string;
  status: string;
  statusColor: "green" | "yellow" | "red";
}

export interface SwapTransaction {
  id: string;
  timestamp: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  status: "pending" | "completed" | "failed";
  txHash?: string;
}

export interface TokenData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  logo: string;
}

interface WalletContextType {
  wallet: WalletState;
  vaultPools: VaultPool[];
  recentActivity: ActivityRecord[];
  swapHistory: SwapTransaction[];
  tokenData: TokenData[];
  isLoadingActivity: boolean;
  isLoadingVaults: boolean;
  isSwapping: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  toggleWallet: () => Promise<void>;
  updateBalance: (asset: string, amount: number) => void;
  executeSwap: (
    fromToken: string,
    toToken: string,
    fromAmount: number,
  ) => Promise<SwapTransaction>;
  getSwapRate: (fromToken: string, toToken: string) => number;
  getTokenData: (symbol: string) => TokenData | undefined;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>(() => {
    // Load saved wallet state on initialization
    const savedState = walletStorage.load();
    return (
      savedState || {
        status: "disconnected",
        address: "",
        balances: { BRLD: 1000, USDC: 5000, TDAO: 250, SOL: 10, PIX: 15000 },
      }
    );
  });

  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isLoadingVaults, setIsLoadingVaults] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);

  // Save wallet state whenever it changes
  useEffect(() => {
    walletStorage.save(wallet);
  }, [wallet]);

  const [vaultPools] = useState<VaultPool[]>([
    {
      id: 1,
      name: "BRLD/USDC",
      apy: "22.5",
      tvl: 1234567,
      userBalance: 0,
      assets: ["BRLD", "USDC"],
    },
    {
      id: 2,
      name: "TDAO/USDC",
      apy: "35.1",
      tvl: 876543,
      userBalance: 0,
      assets: ["TDAO", "USDC"],
    },
    {
      id: 3,
      name: "USDC Farm",
      apy: "8.2",
      tvl: 2500000,
      userBalance: 0,
      assets: ["USDC"],
    },
  ]);

  const [recentActivity] = useState<ActivityRecord[]>([
    {
      time: "2 hrs ago",
      type: "Deposit",
      icon: "↓",
      amount: "1,000 USDC",
      status: "Completed",
      statusColor: "green",
    },
    {
      time: "1 day ago",
      type: "Withdraw",
      icon: "↑",
      amount: "500 USDC",
      status: "Completed",
      statusColor: "green",
    },
    {
      time: "3 days ago",
      type: "Swap",
      icon: "⇄",
      amount: "200 BRLD",
      status: "Pending",
      statusColor: "yellow",
    },
    {
      time: "5 days ago",
      type: "Deposit",
      icon: "↓",
      amount: "750 USDC",
      status: "Failed",
      statusColor: "red",
    },
  ]);

  const [swapHistory, setSwapHistory] = useState<SwapTransaction[]>([
    {
      id: "1",
      timestamp: "2 hours ago",
      fromToken: "BRLD",
      toToken: "USDC",
      fromAmount: 100,
      toAmount: 125,
      rate: 1.25,
      status: "completed",
      txHash: "0x123...abc",
    },
    {
      id: "2",
      timestamp: "1 day ago",
      fromToken: "USDC",
      toToken: "TDAO",
      fromAmount: 750,
      toAmount: 200,
      rate: 3.75,
      status: "completed",
      txHash: "0x456...def",
    },
    {
      id: "3",
      timestamp: "3 days ago",
      fromToken: "TDAO",
      toToken: "BRLD",
      fromAmount: 50,
      toAmount: 150,
      rate: 0.333,
      status: "failed",
    },
  ]);

  const [tokenData] = useState<TokenData[]>([
    {
      symbol: "BRLD",
      name: "Blockchain Land",
      price: 1.25,
      change24h: 2.5,
      volume24h: 150000,
      logo: "🔷",
    },
    {
      symbol: "USDC",
      name: "USD Coin",
      price: 1.0,
      change24h: 0.01,
      volume24h: 2100000,
      logo: "💵",
    },
    {
      symbol: "TDAO",
      name: "Taba DAO",
      price: 3.75,
      change24h: -1.2,
      volume24h: 85000,
      logo: "🏛️",
    },
    {
      symbol: "SOL",
      name: "Solana",
      price: 242.59,
      change24h: 0.2,
      volume24h: 450000,
      logo: "◉",
    },
    {
      symbol: "PIX",
      name: "Brazilian Real (Pix)",
      price: 0.2,
      change24h: -0.1,
      volume24h: 1200000,
      logo: "🇧🇷",
    },
  ]);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingActivity(false);
      setIsLoadingVaults(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const connectWallet = useCallback(async (): Promise<void> => {
    setWallet((prev) => ({ ...prev, status: "connecting" }));

    try {
      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (Math.random() > 0.1) {
        // 90% success rate
        const mockAddress = "GABCDE...WXYZ";
        setWallet((prev) => ({
          ...prev,
          status: "connected",
          address: mockAddress,
        }));
      } else {
        // 10% error rate for demo
        setWallet((prev) => ({ ...prev, status: "error" }));
      }
    } catch (error) {
      setWallet((prev) => ({ ...prev, status: "error" }));
    }
  }, []);

  const disconnectWallet = useCallback((): void => {
    const disconnectedState = {
      status: "disconnected" as const,
      address: "",
      balances: { BRLD: 1000, USDC: 5000, TDAO: 250, SOL: 10, PIX: 15000 },
    };
    setWallet(disconnectedState);
    // Clear saved wallet state
    walletStorage.clear();
  }, []);

  const updateBalance = useCallback((asset: string, amount: number): void => {
    setWallet((prev) => ({
      ...prev,
      balances: {
        ...prev.balances,
        [asset]: amount,
      },
    }));
  }, []);

  const toggleWallet = useCallback(async (): Promise<void> => {
    if (wallet.status === "connected") {
      disconnectWallet();
    } else if (wallet.status === "disconnected" || wallet.status === "error") {
      await connectWallet();
    }
    // Do nothing if connecting (prevent double clicks)
  }, [wallet.status, disconnectWallet, connectWallet]);

  const getSwapRate = useCallback(
    (fromToken: string, toToken: string): number => {
      const fromData = tokenData.find((token) => token.symbol === fromToken);
      const toData = tokenData.find((token) => token.symbol === toToken);

      if (!fromData || !toData) return 0;

      return fromData.price / toData.price;
    },
    [tokenData],
  );

  const getTokenData = useCallback(
    (symbol: string): TokenData | undefined => {
      return tokenData.find((token) => token.symbol === symbol);
    },
    [tokenData],
  );

  const executeSwap = useCallback(
    async (
      fromToken: string,
      toToken: string,
      fromAmount: number,
    ): Promise<SwapTransaction> => {
      setIsSwapping(true);

      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const rate = getSwapRate(fromToken, toToken);
        const toAmount = fromAmount * rate;

        // Check if user has sufficient balance
        const currentBalance =
          wallet.balances[fromToken as keyof typeof wallet.balances] || 0;
        if (currentBalance < fromAmount) {
          throw new Error("Insufficient balance");
        }

        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          const newTransaction: SwapTransaction = {
            id: Date.now().toString(),
            timestamp: "Just now",
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            rate,
            status: "completed",
            txHash: `0x${Math.random().toString(36).substring(2, 15)}`,
          };

          // Update balances
          setWallet((prev) => ({
            ...prev,
            balances: {
              ...prev.balances,
              [fromToken]:
                prev.balances[fromToken as keyof typeof prev.balances] -
                fromAmount,
              [toToken]:
                prev.balances[toToken as keyof typeof prev.balances] + toAmount,
            },
          }));

          // Add to swap history
          setSwapHistory((prev) => [newTransaction, ...prev]);

          return newTransaction;
        } else {
          // 10% failure rate
          const failedTransaction: SwapTransaction = {
            id: Date.now().toString(),
            timestamp: "Just now",
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            rate,
            status: "failed",
          };

          setSwapHistory((prev) => [failedTransaction, ...prev]);
          throw new Error("Swap failed");
        }
      } finally {
        setIsSwapping(false);
      }
    },
    [getSwapRate, wallet],
  );

  const value: WalletContextType = useMemo(
    () => ({
      wallet,
      vaultPools,
      recentActivity,
      swapHistory,
      tokenData,
      isLoadingActivity,
      isLoadingVaults,
      isSwapping,
      connectWallet,
      disconnectWallet,
      toggleWallet,
      updateBalance,
      executeSwap,
      getSwapRate,
      getTokenData,
    }),
    [
      wallet,
      vaultPools,
      recentActivity,
      swapHistory,
      tokenData,
      isLoadingActivity,
      isLoadingVaults,
      isSwapping,
      connectWallet,
      disconnectWallet,
      toggleWallet,
      updateBalance,
      executeSwap,
      getSwapRate,
      getTokenData,
    ],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
