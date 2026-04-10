
-- Create digital_asset_wallets table
CREATE TABLE public.digital_asset_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset TEXT NOT NULL CHECK (asset IN ('USDT', 'USDC')),
  network TEXT NOT NULL DEFAULT 'TRC20' CHECK (network IN ('TRC20', 'ERC20', 'BEP20')),
  balance NUMERIC NOT NULL DEFAULT 0.00,
  wallet_address TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset, network)
);

-- Enable RLS
ALTER TABLE public.digital_asset_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digital asset wallets"
ON public.digital_asset_wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own digital asset wallets"
ON public.digital_asset_wallets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own digital asset wallets"
ON public.digital_asset_wallets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_digital_asset_wallets_updated_at
BEFORE UPDATE ON public.digital_asset_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create digital_asset_transactions table
CREATE TABLE public.digital_asset_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.digital_asset_wallets(id),
  type TEXT NOT NULL CHECK (type IN ('receive', 'swap')),
  asset TEXT NOT NULL CHECK (asset IN ('USDT', 'USDC')),
  amount NUMERIC NOT NULL,
  ngn_amount NUMERIC,
  rate_used NUMERIC,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.digital_asset_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own digital asset transactions"
ON public.digital_asset_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own digital asset transactions"
ON public.digital_asset_transactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_digital_asset_wallets_user_id ON public.digital_asset_wallets(user_id);
CREATE INDEX idx_digital_asset_transactions_user_id ON public.digital_asset_transactions(user_id);
CREATE INDEX idx_digital_asset_transactions_wallet_id ON public.digital_asset_transactions(wallet_id);
CREATE INDEX idx_digital_asset_transactions_created_at ON public.digital_asset_transactions(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_asset_wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_asset_transactions;
