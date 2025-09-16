import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./contexts/WalletContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { Vault } from "./pages/Vault";
import { Swap } from "./pages/SwapPage";
import { StubPage } from "./pages/StubPage";
import { CrowdfundingPage } from "./pages/CrowdfundingPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { FiatDeposit } from "./pages/FiatDepositPage";
import DefyTestPage from "./pages/DefyTestPage";
import "./index.css";

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>
          {/* Onboarding route with standalone layout */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Main app routes with standard layout */}
          <Route
            path="*"
            element={
              <div className="flex flex-col min-h-screen bg-background w-full overflow-x-hidden">
                <Header />

                {/* Main Content */}
                <main className="flex-grow container mx-auto px-6 py-32 relative isolate lg:px-48">
                  {/* Decorative background elements */}
                  <div className="fixed -top-10 -right-20 w-96 h-96 bg-[var(--forest-700)]/10 rounded-full mix-blend-lighten blur-3xl -z-10 opacity-50 pointer-events-none" />
                  <div className="fixed top-10 -left-10 w-80 h-80 bg-[var(--sun-500)]/10 rounded-full mix-blend-lighten blur-3xl -z-10 opacity-50 pointer-events-none" />
                  <div className="fixed bottom-50 -left-20 w-96 h-96 bg-[var(--forest-700)]/10 rounded-full mix-blend-lighten blur-3xl -z-10 opacity-50 pointer-events-none" />
                  <div className="fixed bottom-50 -right-20 w-96 h-96 bg-[var(--sun-500)]/10 rounded-full mix-blend-lighten blur-3xl -z-10 opacity-50 pointer-events-none" />

                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/vault" element={<Vault />} />
                    <Route path="/swap" element={<Swap />} />
                    <Route path="/deposit" element={<FiatDeposit />} />
                    <Route path="/defy-test" element={<DefyTestPage />} />
                    <Route
                      path="/wallets"
                      element={<StubPage title="Wallets" />}
                    />
                    <Route
                      path="/crowdfunding"
                      element={<CrowdfundingPage />}
                    />
                  </Routes>
                </main>

                <Footer />
              </div>
            }
          />
        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;
