-- ArcInvoice Database Schema Migration
-- Creates profiles, invoices, payments, and audit_logs tables with strict RLS and secure functions

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  business_name TEXT,
  email TEXT,
  default_wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  description TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL DEFAULT 'USDC',
  receiving_wallet_address TEXT NOT NULL,
  network_identifier TEXT NOT NULL DEFAULT 'arc-mainnet',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'canceled')),
  due_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  paid_at TIMESTAMPTZ
);

-- 3. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payer_wallet_address TEXT NOT NULL,
  recipient_wallet_address TEXT NOT NULL,
  token_contract_address TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  transaction_hash TEXT NOT NULL UNIQUE,
  block_number BIGINT,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'confirmed', 'failed', 'reverted')),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_invoice_number_idx ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices(status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON public.invoices(due_date);

CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS payments_tx_hash_idx ON public.payments(transaction_hash);
CREATE INDEX IF NOT EXISTS payments_payer_idx ON public.payments(payer_wallet_address);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_invoice_id_idx ON public.audit_logs(invoice_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- INVOICES POLICIES
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Users can delete own invoices" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- PAYMENTS POLICIES
DROP POLICY IF EXISTS "Users can view payments for own invoices" ON public.payments;
CREATE POLICY "Users can view payments for own invoices" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = payments.invoice_id
      AND invoices.user_id = auth.uid()
    )
  );

-- AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURE RPC: GET SAFE PUBLIC INVOICE DATA
-- Allows unauthenticated clients to read only the public fields necessary to review and pay an invoice
CREATE OR REPLACE FUNCTION public.get_public_invoice(p_invoice_number TEXT)
RETURNS TABLE (
  invoice_number TEXT,
  client_name TEXT,
  client_email TEXT,
  description TEXT,
  amount_minor BIGINT,
  currency TEXT,
  receiving_wallet_address TEXT,
  network_identifier TEXT,
  status TEXT,
  due_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  business_name TEXT,
  full_name TEXT,
  payment_tx_hash TEXT,
  payment_confirmed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.invoice_number,
    i.client_name,
    i.client_email,
    i.description,
    i.amount_minor,
    i.currency,
    i.receiving_wallet_address,
    i.network_identifier,
    i.status,
    i.due_date,
    i.notes,
    i.created_at,
    i.paid_at,
    p.business_name,
    p.full_name,
    pay.transaction_hash AS payment_tx_hash,
    pay.confirmed_at AS payment_confirmed_at
  FROM public.invoices i
  LEFT JOIN public.profiles p ON p.id = i.user_id
  LEFT JOIN LATERAL (
    SELECT transaction_hash, confirmed_at
    FROM public.payments
    WHERE invoice_id = i.id AND verification_status = 'confirmed'
    ORDER BY confirmed_at DESC
    LIMIT 1
  ) pay ON true
  WHERE i.invoice_number = p_invoice_number;
END;
$$;

-- SECURE RPC: ATOMICALLY RECORD VERIFIED PAYMENT
-- Idempotently updates the invoice status, records payment, and writes audit log
CREATE OR REPLACE FUNCTION public.record_verified_payment(
  p_invoice_number TEXT,
  p_payer_wallet TEXT,
  p_recipient_wallet TEXT,
  p_token_contract TEXT,
  p_amount_minor BIGINT,
  p_transaction_hash TEXT,
  p_block_number BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_payment RECORD;
  v_existing_payment RECORD;
BEGIN
  -- 1. Find the invoice
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE invoice_number = p_invoice_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invoice not found');
  END IF;

  -- 2. Check if this transaction hash was already confirmed
  SELECT * INTO v_existing_payment
  FROM public.payments
  WHERE transaction_hash = p_transaction_hash;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_confirmed', true,
      'invoice_id', v_invoice.id,
      'payment_id', v_existing_payment.id,
      'status', 'paid',
      'transaction_hash', v_existing_payment.transaction_hash
    );
  END IF;

  -- 3. Verify recipient matches receiving_wallet_address
  IF LOWER(v_invoice.receiving_wallet_address) <> LOWER(p_recipient_wallet) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient address does not match invoice');
  END IF;

  -- 4. Verify amount matches
  IF v_invoice.amount_minor <> p_amount_minor THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment amount does not match invoice amount');
  END IF;

  -- 5. Insert payment record
  INSERT INTO public.payments (
    invoice_id,
    payer_wallet_address,
    recipient_wallet_address,
    token_contract_address,
    amount_minor,
    transaction_hash,
    block_number,
    verification_status,
    confirmed_at
  )
  VALUES (
    v_invoice.id,
    p_payer_wallet,
    p_recipient_wallet,
    p_token_contract,
    p_amount_minor,
    p_transaction_hash,
    p_block_number,
    'confirmed',
    now()
  )
  RETURNING * INTO v_payment;

  -- 6. Update invoice status
  UPDATE public.invoices
  SET 
    status = 'paid',
    paid_at = now(),
    updated_at = now()
  WHERE id = v_invoice.id;

  -- 7. Add audit log
  INSERT INTO public.audit_logs (
    user_id,
    invoice_id,
    event_type,
    metadata
  )
  VALUES (
    v_invoice.user_id,
    v_invoice.id,
    'payment_confirmed',
    jsonb_build_object(
      'transaction_hash', p_transaction_hash,
      'block_number', p_block_number,
      'amount_minor', p_amount_minor,
      'payer', p_payer_wallet,
      'recipient', p_recipient_wallet
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_confirmed', false,
    'invoice_id', v_invoice.id,
    'payment_id', v_payment.id,
    'status', 'paid',
    'transaction_hash', p_transaction_hash
  );
END;
$$;
