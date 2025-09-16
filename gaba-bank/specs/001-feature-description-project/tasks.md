# Task Plan: Defy Invest MVP Frontend

This document outlines the development tasks for building the Defy Invest MVP. Tasks are ordered by dependency, with parallelizable tasks marked as `[P]`.

---

### Phase 0: Project Setup & Configuration

- foundational setup for the entire project. Must be completed sequentially.

* **T001**: Initialize a new project using the **Stellar Scaffold**. command: `stellar scaffold init name-project`

  - **File**: `(project root)`
  - **Details**: This sets up the entire project structure with Vite, TypeScript, and Tailwind CSS.

* **T002**: Install additional npm dependencies.

  - **File**: `package.json`
  - **Details**: Add `zustand` for state management, `msw` for mocking, and `@stellar/freighter-api` for wallet interaction.

* **T003**: Create the core directory structure.

  - **Files**: `src/components`, `src/app`, `src/mocks`, `src/services`, `src/store`, `src/types`
  - **Details**: Create all folders as defined in the `plan.md`.

* **T004**: Configure Jest and React Testing Library.
  - **Files**: `jest.config.js`, `jest.setup.js`
  - **Details**: Ensure the testing framework is ready for component and integration tests.

---

### Phase 1: Mocking, Types, and Core Services

- a mix of parallel and sequential tasks to build the data layer and services.

* **T005**: Define TypeScript interfaces for all data models. `[P]`

  - **File**: `src/types/index.ts`
  - **Details**: Create and export `Wallet`, `Asset`, `Vault`, `Transaction`, and other types from `data-model.md`.

* **T006**: Create mock database and API handlers.

  - **Files**: `src/mocks/db.ts`, `src/mocks/handlers.ts`
  - **Details**: Implement MSW handlers for every endpoint in `contracts/wallet.md` and `contracts/vault.md`. Simulate success and failure states.
  - **Depends on**: T005

* **T007**: Initialize and enable MSW for development.

  - **Files**: `src/app/layout.tsx`, `public/mockServiceWorker.js`
  - **Details**: Run `npx msw init public/` and configure the application to use the mock server.

* **T008**: Implement the Wallet Service.

  - **File**: `src/services/walletService.ts`
  - **Details**: Create functions to connect, disconnect, and get wallet details using `@stellar/freighter-api`.

* **T009**: Create the global wallet state store.
  - **File**: `src/store/walletStore.ts`
  - **Details**: Use Zustand to manage `isConnected`, `publicKey`, etc., based on `data-model.md`.
  - **Depends on**: T008

---

### Phase 2: Reusable UI Component Library

- these components are self-contained and can be developed in parallel.

* **T010**: Create `Button` component. `[P]`

  - **File**: `src/components/ui/Button.tsx`
  - **Test**: `src/components/ui/Button.test.tsx`

* **T011**: Create `Card` component. `[P]`

  - **File**: `src/components/ui/Card.tsx`
  - **Test**: `src/components/ui/Card.test.tsx`

* **T012**: Create `Modal` component. `[P]`

  - **File**: `src/components/ui/Modal.tsx`
  - **Test**: `src/components/ui/Modal.test.tsx`

* **T013**: Create `Input` component. `[P]`

  - **File**: `src/components/ui/Input.tsx`
  - **Test**: `src/components/ui/Input.test.tsx`

* **T014**: Create `KpiCard` component for vault metrics. `[P]`

  - **File**: `src/components/KpiCard.tsx`
  - **Test**: `src/components/KpiCard.test.tsx`

* **T015**: Create `TransactionTable` component. `[P]`
  - **File**: `src/components/TransactionTable.tsx`
  - **Test**: `src/components/TransactionTable.test.tsx`

---

### Phase 3: Page Construction & Integration

- build pages in parallel, then integrate them sequentially.

* **T016**: Build the application `Header` and `Footer`.

  - **Files**: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/app/layout.tsx`
  - **Details**: The header will contain the main navigation and the "Connect Wallet" button logic.
  - **Depends on**: T009, T010

* **T017**: Build the `LandingPage` with its two states. `[P]`

  - **File**: `src/app/page.tsx`
  - **Details**: Implement the connected vs. disconnected views.
  - **Depends on**: T016

* **T018**: Build the `VaultPage`. `[P]`

  - **File**: `src/app/vault/page.tsx`
  - **Details**: Integrate `KpiCard` and `TransactionTable`. Fetch mock data.
  - **Depends on**: T014, T015

* **T019**: Build the `CrowdfundingPage` and `WalletsPage` stubs. `[P]`

  - **Files**: `src/app/crowdfunding/page.tsx`, `src/app/wallets/page.tsx`
  - **Details**: Simple static pages with "Coming Soon" messages.

* **T020**: Implement the 3-step Deposit/Withdrawal modal flow.

  - **File**: `src/components/TransactionModal.tsx`
  - **Details**: Create the multi-step form inside the `Modal` component.
  - **Depends on**: T012, T013

* **T021**: Integrate the `TransactionModal` with the `VaultPage`.
  - **File**: `src/app/vault/page.tsx`
  - **Details**: Wire the "Deposit" and "Withdraw" buttons to open the modal and interact with the mock service.
  - **Depends on**: T018, T020

---

### Phase 4: Testing & Polish

- final end-to-end testing and quality checks.

* **T022**: Write integration test for the wallet connection flow. `[P]`

  - **File**: `src/tests/integration/wallet.test.tsx`
  - **Details**: Test the full user flow of connecting and disconnecting the wallet, verifying UI changes.

* **T023**: Write integration test for the vault deposit/withdrawal flow. `[P]`

  - **File**: `src/tests/integration/vault.test.tsx`
  - **Details**: Test the modal flow for both success and failure cases.

* **T024**: Perform a full accessibility audit. `[P]`

  - **Details**: Check for keyboard navigation, screen reader compatibility, and color contrast across the app.

* **T025**: Finalize `README.md` and `quickstart.md`. `[P]`
  - **Files**: `README.md`, `specs/001-feature-description-project/quickstart.md`

---

### Parallel Execution Examples

You can parallelize component and page creation after Phase 1 is complete.

**Example 1: Build UI library**

```bash
# Terminal 1
gemini task T010
# Terminal 2
gemini task T011
# Terminal 3
gemini task T012
```

**Example 2: Build pages while UI components are being made**

```bash
# Terminal 1
gemini task T014
# Terminal 2
gemini task T017
# Terminal 3
gemini task T018
```
