# CircleChain Component Architecture & Hierarchy 🧩

This document catalogs the component architecture of CircleChain, defining roles, state inputs, and interactions across the application.

---

## 1. Directory Structure

```text
frontend/components/
├── navbar.tsx              # Top-level global header & wallet identity trigger
├── wallet-button.tsx       # Compact wallet state indicator & quick action
├── wallet-modal.tsx        # Multi-wallet connection dialog (Freighter, Albedo, xBull, LOBSTR)
├── contribution-grid.tsx   # Matrix visualization of ROSCA cycle contributions
└── ui/
    ├── badge.tsx           # Status indicators & chip badges
    ├── button.tsx          # Accessible interactive buttons with variant styling
    ├── card.tsx            # Glassmorphic card container primitives
    ├── input.tsx           # Form text inputs & number fields with error states
    └── sonner.tsx          # Real-time event notifications & toast emitter
```

---

## 2. Core Components Catalog

### 2.1 Navigation & Identity

#### `Navbar` (`frontend/components/navbar.tsx`)
- **Role**: Persistent navigation across all App Router routes (`/`, `/circles`, `/circles/create`, `/profile`).
- **Key Features**:
  - Displays dynamic Stellar network badge (`TESTNET` / `FUTURENET`).
  - Active route highlighting.
  - Integrates `WalletButton` with responsive mobile menu sheet.
  - Quick link to open-source GitHub repository and Drips verified profile.

#### `WalletButton` (`frontend/components/wallet-button.tsx`)
- **Role**: Context-aware trigger for wallet authentication.
- **States**:
  - **Disconnected**: Displays "Connect Wallet" with pulsating indicator.
  - **Connecting**: Loading spinner with timeout guard.
  - **Connected**: Formatted Stellar address (`GABC...WXYZ`) with truncated display and balance indicator.
- **Interactions**: Toggles `WalletModal`.

#### `WalletModal` (`frontend/components/wallet-modal.tsx`)
- **Role**: Enterprise-grade multi-wallet selector supporting non-custodial Stellar authentication.
- **Supported Providers**:
  - **Freighter**: Chrome/Brave extension integration via `@stellar/freighter-api`.
  - **Albedo**: Web popup authentication for mobile and browser users without extensions.
  - **xBull**: Hardware and mobile web connector.
  - **LOBSTR**: Mobile signer integration.
- **Security Guarantees**: Purely public-key based. Private keys NEVER touch memory or backend.

---

### 2.2 ROSCA Core Lifecycle

#### `ContributionGrid` (`frontend/components/contribution-grid.tsx`)
- **Role**: Interactive visual grid mapping cycle contributions across all circle participants.
- **Props**:
  - `circleId`: Unique identifier (`u64` Soroban / BigInt Prisma).
  - `memberCount`: Total number of savers in the circle.
  - `currentCycle`: Current active round index.
  - `contributions`: Array of confirmed on-chain / off-chain payments.
  - `userAddress`: Connected wallet public key for role-based highlighting.
- **Interactions**: Enables 1-click contribution trigger for pending deadlines.

---

### 2.3 UI Primitives (`components/ui`)

#### `Button` (`frontend/components/ui/button.tsx`)
- **Variants**: `default`, `outline`, `secondary`, `ghost`, `destructive`, `glow`.
- **Sizes**: `sm`, `md`, `lg`, `icon`.
- **Accessibility**: Full keyboard navigation, `aria-disabled` handling, focus rings.

#### `Card` (`frontend/components/ui/card.tsx`)
- **Subcomponents**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- **Style**: Tailored glassmorphism with subtle gradient borders (`border-white/10` against dark background).

#### `Badge` (`frontend/components/ui/badge.tsx`)
- **Variants**: `default`, `success`, `warning`, `destructive`, `outline`, `soroban`.
- **Usage**: ROSCA pool status tags (`Forming`, `Active`, `Completed`, `Defaulted`).

---

## 3. Page Architecture Hierarchy

```mermaid
graph TD
    AppLayout[Root Layout - layout.tsx] --> Nav[Navbar]
    AppLayout --> Toaster[Sonner Toast Provider]
    AppLayout --> Pages[App Router Pages]
    
    Pages --> Home[Dashboard - /page.tsx]
    Pages --> CirclesExplore[Circle Directory - /circles/page.tsx]
    Pages --> CircleDetail[Circle Room - /circles/[id]/page.tsx]
    Pages --> CreateCircle[Circle Wizard - /circles/create/page.tsx]
    Pages --> UserProfile[Reputation & SBT - /profile/page.tsx]

    Home --> CGrid[ContributionGrid]
    CircleDetail --> CGrid
    Nav --> WModal[WalletModal]
```
