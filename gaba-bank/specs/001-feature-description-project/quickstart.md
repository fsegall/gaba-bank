# Quickstart Guide: Defy Invest MVP Frontend

This guide provides instructions for setting up and running the project locally.

## 1. Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Freighter Wallet extension installed in your browser

## 2. Project Setup

1.  **Clone the repository**:
    ```bash
    git clone [repo-url]
    cd [project-directory]
    ```
2.  **Switch to the feature branch**:
    ```bash
    git checkout 001-feature-description-project
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```

## 3. Running the Application

1.  **Start the development server**:
    ```bash
    npm run dev
    ```
2.  **Open the application**:
    - Navigate to `http://localhost:3000` in your browser.

## 4. Running Tests

- **Run all tests**:
  ```bash
  npm test
  ```
- The test suite includes unit tests for components, integration tests for user flows, and an automated accessibility audit.

## 5. Key Features to Test

- **Wallet Connection**:
  - Click the "Connect Wallet" button.
  - Approve the connection in the Freighter extension.
  - The UI should update to the "Connected" state, showing your wallet address.
- **Vault Interaction**:
  - Navigate to the "Vault" page.
  - Use the "Deposit" and "Withdraw" modals to simulate transactions.
  - Check the transaction history table for updates.
- **Stub Pages**:
  - Visit the "Crowdfunding" and "Wallets" pages to ensure they display "Coming soon" messages.

## 5. Mock Service Worker (MSW)

- The application uses MSW to simulate backend responses.
- You can view the mock API definitions in `src/mocks/handlers.ts`.
- To test failure cases, you can modify the handlers to return error responses. For example, change a `res(ctx.status(200))` to `res(ctx.status(400))`.
