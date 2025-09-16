# Defy Invest MVP - Frontend

This repository contains the frontend application for the Defy Invest MVP, a decentralized community banking platform built on Stellar.

This is a **standalone frontend application**. All backend interactions, including blockchain transactions (Soroban), database calls, and external APIs, are **simulated** using a local mock data service (MSW).

## ✨ Core Features

- **Wallet Connection**: Simulate connecting a Freighter wallet to the application.
- **Dynamic Landing Page**: The UI adapts based on the user's wallet connection status.
- **DeFi Vault**: A core feature where users can view mock metrics (TVL, PPS) and a history of their simulated deposit and withdrawal transactions.
- **Multi-Step Transactions**: A 3-step modal flow (Input, Review, Result) for deposits and withdrawals.
- **Stub Pages**: Placeholder pages for future Crowdfunding and Wallet management features.
- **TESTNET Mode**: A persistent "TESTNET" badge is displayed in the header to indicate the application is in a testing state.

## 🛠️ Tech Stack

- **Framework**: React (with Vite)
- **Language**: TypeScript
- **Styling**: Stellar Design System & Tailwind CSS (via `@stellar/design-system`)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **API Mocking**: Mock Service Worker (MSW)
- **Wallet Integration**: `@stellar/freighter-api`
- **Testing**: Jest, React Testing Library, Jest-Axe for accessibility

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Freighter Wallet extension installed in your browser

### Setup and Running

1.  **Install dependencies**:

    ```bash
    npm install
    ```

2.  **Start the development server**:

    ```bash
    npm run dev
    ```

3.  **Open the application**:
    - Navigate to `http://localhost:5173` (or the port specified in your terminal) in your browser.

### Running Tests

To run the complete test suite, including unit, integration, and accessibility tests:

```bash
npm test
```
