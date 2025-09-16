import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { TabaDAOLogo } from "./TabaDAOLogo";
import { useWallet } from "../contexts/WalletContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Menu, X, Wallet } from "lucide-react";
import NavigationMenuWithActiveItem from "./customized/navigation-menu/navigation-menu-05";

const navLinks = [
  { path: "/home", label: "Home" },
  { path: "/vault", label: "Vault" },
  { path: "/swap", label: "Swap" },
  { path: "/deposit", label: "Fiat Deposit" },
  { path: "/wallets", label: "Wallets" },
  { path: "/crowdfunding", label: "Crowdfunding" },
];

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { wallet, toggleWallet } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigate to landing page when wallet disconnects
  useEffect(() => {
    if (wallet.status === "disconnected" && location.pathname !== "/") {
      navigate("/");
    }
  }, [wallet.status, location.pathname, navigate]);

  const renderWalletButton = (isMobile = false) => {
    switch (wallet.status) {
      case "connecting":
        return (
          <button
            type="button"
            disabled
            className="flex items-center justify-center space-x-2 bg-[var(--earth-800)] p-2 rounded-lg border border-[rgba(245,242,237,0.1)] opacity-50 cursor-not-allowed w-48"
          >
            <div className="animate-spin h-4 w-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--sun-400)]"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--sand-200)]">
              Connecting
            </span>
            <span className="block w-2 h-2 rounded-full bg-[var(--sun-400)]" />
          </button>
        );

      case "connected": {
        const shortAddress = `${wallet.address.substring(
          0,
          4,
        )}...${wallet.address.slice(-4)}`;
        return (
          <button
            type="button"
            onClick={toggleWallet}
            className={`flex items-center space-x-6 bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-lg p-2 hover:bg-[rgba(62,50,42,0.8)] transition-colors cursor-pointer w-48 justify-center ${
              isMobile ? "justify-center w-full" : ""
            }`}
            title="Click to disconnect wallet"
          >
            <span className="text-sm font-mono text-[var(--sand-200)]/60">
              {shortAddress}
            </span>
            <span className="block w-2 h-2 rounded-full bg-[var(--forest-500)] animate-pulse" />
          </button>
        );
      }

      case "error":
        return (
          <Button
            onClick={toggleWallet}
            className="bg-red-500/10 border-[0.5px] border-red-400 text-red-400 text-sm w-48 p-2"
          >
            <div className="w-4 h-4 mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-circle-x-icon lucide-circle-x "
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6" />
                <path d="m9 9 6 6" />
              </svg>
            </div>
            Try Again
          </Button>
        );

      default: // disconnected
        if (isMobile) {
          return (
            <button
              type="button"
              onClick={toggleWallet}
              className="flex items-center space-x-2 bg-[var(--earth-700)] border border-[rgba(245,242,237,0.1)] rounded-lg px-3 py-2 hover:bg-[rgba(62,50,42,0.8)] transition-colors w-full"
            >
              <Wallet className="h-5 w-5 text-[var(--sun-400)]" />
              <span className="text-sm font-semibold text-[var(--sand-200)]">
                Connect Wallet
              </span>
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={toggleWallet}
            className="flex items-center justify-beetween space-x-2 bg-[var(--earth-700)]/20 p-2 rounded-lg border border-[rgba(245,242,237,0.1)] hover:bg-[rgba(62,50,42,0.8)] transition-colors cursor-pointer w-48"
            title="Click to connect wallet"
          >
            <Wallet className="h-3 w-6 text-[var(--sun-400)]" />
            <p className="text-muted font-medium">Connect Wallet</p>
            <span className="block w-2 h-2 rounded-full bg-[var(--sun-400)]" />
          </button>
        );
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[var(--earth-800)]/20 backdrop-blur-xl border-b border-[rgba(245,242,237,0.05)]">
      <div className="container mx-auto lg:px-40 px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3bg-green-300">
              <TabaDAOLogo />
              <div className="flex flex-col justify-center">
                <span className="uppercase font-bold text-base leading-tight tracking-tight">
                  Baga Bank
                </span>
                <span className="text-[10px] leading-tight -mt-1 text-muted">
                  Community Banking
                </span>
              </div>
            </Link>

            {/* Testnet Badge */}
            <Badge className="border border-[var(--sand-200)]/40 text-[var(--sand-200)]/80 text-[10px] font-semibold px-1.5 h-7 rounded-md bg-[var(--sand-200)]/5 ml-5 mr-auto">
              <span className="animate-pulse duration-1000 transition-all">
                TESTNET
              </span>
            </Badge>
          </div>

          {/* Desktop Menu Options */}
          <NavigationMenuWithActiveItem className="py-4 hidden lg:flex" />

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center justify-between space-x-4 w-1/5">
            <div id="wallet-badge" className="relative mx-auto">
              {renderWalletButton()}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <div className="lg:hidden flex relative items-center space-x-4">
              {/* New Mobile Menu Button */}
              <div id="wallet-badge" className="relative mx-auto">
                {wallet.status === "connected" ? (
                  <button
                    type="button"
                    onClick={toggleWallet}
                    className="flex items-center justify-between space-x-2 bg-[var(--forest-700)]/20 p-2 rounded-lg border border-[var(--forest-500)]/40 hover:bg-[var(--forest-700)]/30 transition-colors w-fit cursor-pointer"
                    title="Connected - Click to disconnect"
                  >
                    <Wallet className="h-4 w-4 text-[var(--forest-500)]" />
                    <span className="block w-2 h-2 rounded-full bg-[var(--forest-500)] animate-pulse" />
                  </button>
                ) : wallet.status === "connecting" ? (
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center space-x-2 bg-[var(--earth-800)] py-2 px-3 rounded-lg border border-[rgba(245,242,237,0.1)] opacity-50 w-fit cursor-not-allowed"
                  >
                    <div className="animate-spin h-4 w-4 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[var(--sun-400)]"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    </div>
                    <span className="block w-2 h-2 rounded-full bg-[var(--sun-400)]" />
                  </button>
                ) : wallet.status === "error" ? (
                  <button
                    type="button"
                    onClick={toggleWallet}
                    className="flex items-center justify-center space-x-2 bg-red-500/10 p-2 rounded-lg border border-red-400/40 hover:bg-red-500/20 transition-colors w-fit cursor-pointer"
                    title="Error - Click to try again"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-400"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="m15 9-6 6" />
                      <path d="m9 9 6 6" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleWallet}
                    className="flex items-center justify-beetween space-x-2 bg-[var(--earth-700)]/20 p-2 rounded-lg border border-[rgba(245,242,237,0.1)] hover:bg-[rgba(62,50,42,0.8)] transition-colors w-fit cursor-pointer"
                    title="Click to connect wallet"
                  >
                    <Wallet className="h-3 w-6 text-[var(--sun-400)]" />
                    <span className="block w-2 h-2 rounded-full bg-[var(--sun-400)]" />
                  </button>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[var(--clay-400)] hover:text-[var(--sand-200)] hover:bg-[var(--earth-700)] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">
                {mobileMenuOpen ? "Close menu" : "Open menu"}
              </span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden block pb-4">
            <nav className="flex flex-col space-y-2 mt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-[var(--clay-400)] hover:bg-[var(--earth-700)]/10 hover:text-[var(--sand-200)] rounded-md transition-colors ${
                    location.pathname === link.path
                      ? "text-[var(--sun-400)] bg-[var(--earth-700)]"
                      : ""
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-[rgba(245,242,237,0.1)] space-y-4">
              <div className="w-full">{renderWalletButton(true)}</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
