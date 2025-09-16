# Phase 0: Research & Scaffolding

## Research Summary

Based on the technical context and feature specification, the following decisions and research points have been established.

### 1. Scaffolding Tool

- **Tool**: **Stellar Scaffold**
- **Reasoning**: This is a mandatory requirement from the technical context. It provides a standardized, best-practice starting point for Stellar-based frontend applications, ensuring consistency and reducing setup time.
- **Action**: Initialize the project using the appropriate Stellar Scaffold command for a Next.js + TypeScript + Tailwind CSS project.

### 2. State Management

- **Options**: React Context, Zustand.
- **Decision**: **Zustand**.
- **Reasoning**: While React Context is built-in, Zustand offers a simpler API, better performance for frequent updates, and avoids the provider-nesting issue, making it more scalable for managing global state like wallet connection status and user data.
- **Action**: Add Zustand as a dependency and create a store for wallet state.

### 3. Data Mocking

- **Tool**: **Mock Service Worker (MSW)**
- **Reasoning**: MSW intercepts network requests at the service worker level, providing a seamless and realistic mocking experience without modifying application code. It's more robust than static JSON files, as it can simulate network latency, error states, and dynamic responses.
- **Action**: Set up MSW with handlers for all required mock API endpoints (vault metrics, user balances, transactions).

### 4. Wallet Integration

- **Library**: `@stellar/freighter-api`
- **Reasoning**: This is the official library for interacting with the Freighter wallet extension.
- **Action**: Create a dedicated service module (`src/services/walletService.ts`) to encapsulate all interactions with the Freighter API. This service will manage connection, disconnection, and fetching the user's public key. All transaction-signing functions will be mocked.

## Scaffolding Plan

1.  Run the Stellar Scaffold CLI to create a new Next.js project.
2.  Install additional dependencies: `zustand`, `msw`, `@stellar/freighter-api`.
3.  Initialize MSW using its CLI command to create the service worker file in the `public/` directory.
4.  Configure the project to use MSW for development and testing environments.
5.  Create the directory structure outlined in the `plan.md` (`src/components`, `src/mocks`, `src/services`, `src/store`).
