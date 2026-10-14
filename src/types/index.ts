export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'canceled';
export type PaymentVerificationStatus = 'pending' | 'confirmed' | 'failed' | 'reverted';

export interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  email: string | null;
  default_wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  client_name: string;
  client_email: string | null;
  description: string;
  amount_minor: string | number | bigint; // Stored as BigInt string in JSON
  currency: string;
  receiving_wallet_address: string;
  network_identifier: string;
  status: InvoiceStatus;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  // Joins
  payments?: Payment[];
}

export interface PublicInvoice {
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  description: string;
  amount_minor: string | number | bigint;
  currency: string;
  receiving_wallet_address: string;
  network_identifier: string;
  status: InvoiceStatus;
  due_date: string;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  business_name: string | null;
  full_name: string | null;
  payment_tx_hash: string | null;
  payment_confirmed_at: string | null;
}

export interface Payment {
  id: string;
  invoice_id: string;
  payer_wallet_address: string;
  recipient_wallet_address: string;
  token_contract_address: string;
  amount_minor: string | number | bigint;
  transaction_hash: string;
  block_number: number | null;
  verification_status: PaymentVerificationStatus;
  confirmed_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  invoice_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardMetrics {
  totalInvoicedMinor: bigint;
  totalConfirmedMinor: bigint;
  outstandingMinor: bigint;
  overdueCount: number;
  totalInvoiceCount: number;
  paidInvoiceCount: number;
  pendingInvoiceCount: number;
  recentInvoices: Invoice[];
}

export interface VerifyPaymentPayload {
  invoice_number: string;
  transaction_hash: string;
  payer_wallet_address?: string;
}

export interface VerificationResult {
  success: boolean;
  status: 'paid' | 'pending' | 'failed' | 'reverted';
  transaction_hash: string;
  already_confirmed?: boolean;
  block_number?: number;
  confirmed_at?: string;
  error?: string;
  explorer_url?: string;
}

export interface NetworkConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  usdcContractAddress: `0x${string}`;
  usdcDecimals: number;
  isTestnet: boolean;
}
