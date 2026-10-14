# ArcInvoice — Stablecoin Invoicing on Circle Arc

**ArcInvoice** is a full-stack, non-custodial stablecoin invoicing application built for freelancers, agencies, and web3 developers. It enables businesses to bill clients in USDC, generate branded payment links and QR codes, accept payments on Circle's Arc Layer 1 blockchain, and automatically verify settlement through independent on-chain transaction logs.

---

## 1. Key Features

- **Circle Arc Native Settlement**: Direct peer-to-peer ERC-20 USDC transfers to your receiving wallet address with zero intermediary escrow holding fees.
- **Independent On-Chain Verification**: The backend queries Arc RPC nodes, inspects EVM `Transfer(address,address,uint256)` event logs, and strictly checks `recipient`, `amount_minor`, and block confirmations before marking invoices as paid.
- **Idempotent Verification Engine**: Prevents double-processing, duplicate receipts, and replay vulnerabilities.
- **Frictionless Non-Technical Client Experience**: Clients open a clean, light-themed invoice page, connect MetaMask or any injected EVM wallet, and approve the USDC transaction in one click.
- **Printable & Downloadable Receipts**: Instant generation of official settlement receipts containing verified transaction hashes, block numbers, timestamps, and Arcscan explorer links.
- **Real-Time Financial Dashboard**: Aggregates total invoiced USDC, confirmed paid volume, outstanding amounts, and overdue alerts calculated directly from real PostgreSQL records.
- **Strict PostgreSQL Security (RLS)**: Row Level Security policies protect user records, while secure PostgreSQL `SECURITY DEFINER` functions expose safe public invoice data for client payment.

---

## 2. Circle Arc Network Configuration

Arc is Circle’s stablecoin-native Layer 1 blockchain, engineered with USDC as the protocol-level native gas and settlement currency.

| Network Parameter | Arc Mainnet (Production) | Arc Testnet (Development) |
| :--- | :--- | :--- |
| **Network Name** | Arc | Arc Testnet |
| **Chain ID** | `5042` (`0x13BA`) | `5042002` (`0x4CEF52`) |
| **RPC Endpoint** | `https://rpc.mainnet.arc.io` | `https://rpc.testnet.arc.network` |
| **USDC Contract (ERC-20)** | `0x3600000000000000000000000000000000000000` | `0x3600000000000000000000000000000000000000` |
| **Token Decimals** | `6` (ERC-20 interface) / `18` (Native) | `6` (ERC-20 interface) / `18` (Native) |
| **Block Explorer** | [https://explorer.arc.io](https://explorer.arc.io) | [https://testnet.arcscan.app](https://testnet.arcscan.app) |

---

## 3. Technology Stack

- **Framework**: Next.js 14 App Router (React 18, TypeScript Strict)
- **Styling**: Tailwind CSS with custom fintech design system (Light theme default)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase SSR
- **Blockchain Client**: Viem 2 & Wagmi 3 for EVM connectivity and ERC-20 log decoding
- **Validation**: Zod schema validation on both client and API endpoints
- **Data Visualization**: Recharts for revenue comparison
- **Testing**: Vitest with unit and integration test suites

---

## 4. Database Architecture & Migrations

The database migration is committed under `supabase/migrations/20261014000000_init_arcinvoice.sql`.

### Tables

1. `profiles`: Stores authenticated user profile details, business name, and default receiving wallet.
2. `invoices`: Core invoice records, storing 6-decimal integer base units (`amount_minor`), status, due date, and client details.
3. `payments`: Records on-chain confirmed transactions with unique tx hashes, block numbers, and confirmation timestamps.
4. `audit_logs`: Audit trail for invoice creation, status modifications, and payment settlements.

### Security Definer Functions

- `get_public_invoice(p_invoice_number)`: Exposes only safe public fields needed for a client to review and pay an invoice, preventing exposure of private user records.
- `record_verified_payment(...)`: Atomically and idempotently marks an invoice as paid, records the payment record, and appends an audit log entry.

---

## 5. API Endpoints

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | List authenticated user invoices | Private (Auth) |
| `POST` | `/api/invoices` | Create a new invoice | Private (Auth) |
| `GET` | `/api/invoices/[id]` | Get single invoice details | Private (Owner) |
| `PATCH` | `/api/invoices/[id]` | Update unpaid invoice fields | Private (Owner) |
| `POST` | `/api/invoices/[id]/cancel` | Cancel unpaid invoice | Private (Owner) |
| `GET` | `/api/public/invoices/[invoiceNumber]` | Get public invoice payment data | Public |
| `POST` | `/api/payments/verify` | Independently verify on-chain tx | Public |
| `GET` | `/api/payments/history` | Retrieve user payment history | Private (Auth) |
| `GET` | `/api/health` | Health & Arc RPC diagnostic check | Public |
| `POST` | `/api/cron/reconcile` | Background tx reconciliation | Secret Bearer |

---

## 6. Environment Variables (`.env.example`)

```bash
# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-service-role-key-optional

# Arc Blockchain Configuration
NEXT_PUBLIC_ARC_CHAIN_ID=5042
ARC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.mainnet.arc.io
NEXT_PUBLIC_ARC_EXPLORER_URL=https://explorer.arc.io
NEXT_PUBLIC_USDC_CONTRACT_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_USDC_DECIMALS=6

# Cron Secret for automated payment reconciliation
CRON_SECRET=your-secret-cron-token
```

---

## 7. Local Setup and Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/ArcInvoice.git
cd ArcInvoice
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your Supabase URL and Arc RPC credentials.
```bash
cp .env.example .env.local
```

### 3. Run Database Migrations
Run the SQL migration in `supabase/migrations/20261014000000_init_arcinvoice.sql` using Supabase CLI or SQL Editor.

### 4. Run the Test Suite
```bash
npm test
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access ArcInvoice.

---

## 8. Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Framework Preset to **Next.js**.
4. Configure all environment variables from `.env.example`.
5. Deploy.

---

## 9. Status of Integrations

| Component | Status | Notes |
| :--- | :--- | :--- |
| **Database & Schema** | Verified | Live Supabase PostgreSQL database migrated with RLS & RPCs |
| **Authentication** | Verified | Session persistence, login, signup, and protected dashboard shell |
| **Invoice Engine** | Verified | Zod-validated creation, unique invoice numbering, 6-decimal base units |
| **Arc Mainnet Config** | Verified | Configured with official Chain ID `5042` and USDC contract `0x3600...` |
| **EVM Wallet Integration**| Verified | Wagmi & injected wallet connectors with network switch prompts |
| **On-Chain Verification**| Verified | Independent ERC-20 event log decoding with recipient and amount validation |
| **Automated Test Suite** | Verified | 17/17 tests passing across conversions, transitions, validation, and logs |
| **Printable Receipts** | Verified | Downloadable/printable CSS receipts with Arc explorer links |
