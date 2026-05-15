
CREATE TABLE public.swap_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  swap_reference TEXT NOT NULL UNIQUE,
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  ngn_amount NUMERIC NOT NULL,
  rate_used NUMERIC NOT NULL,
  provider TEXT NOT NULL DEFAULT 'internal_treasury',
  provider_tx_id TEXT,
  hot_wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swap_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settlements"
  ON public.swap_settlements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_swap_settlements_status ON public.swap_settlements(status);
CREATE INDEX idx_swap_settlements_user ON public.swap_settlements(user_id);

CREATE TRIGGER swap_settlements_updated_at
  BEFORE UPDATE ON public.swap_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.treasury_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset TEXT NOT NULL,
  direction TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  related_settlement_id UUID REFERENCES public.swap_settlements(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'internal_treasury',
  provider_tx_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treasury_movements ENABLE ROW LEVEL SECURITY;
