
-- Virtual cards table
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number_last4 TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','frozen','cancelled')),
  spending_limit NUMERIC(18,2) NOT NULL DEFAULT 5000.00,
  amount_spent_month NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  card_type TEXT NOT NULL DEFAULT 'virtual',
  brand TEXT NOT NULL DEFAULT 'Visa',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- FX rates table
CREATE TABLE public.fx_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  base_rate NUMERIC(18,6) NOT NULL,
  spread_percent NUMERIC(5,4) NOT NULL DEFAULT 0.5000,
  effective_rate NUMERIC(18,6) GENERATED ALWAYS AS (base_rate * (1 + spread_percent / 100)) STORED,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Enable RLS
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

-- Virtual cards policies
CREATE POLICY "Users can view own cards" ON public.virtual_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own cards" ON public.virtual_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.virtual_cards FOR UPDATE USING (auth.uid() = user_id);

-- FX rates policies (readable by all authenticated)
CREATE POLICY "Authenticated users can view fx rates" ON public.fx_rates FOR SELECT TO authenticated USING (true);

-- Triggers
CREATE TRIGGER update_virtual_cards_updated_at BEFORE UPDATE ON public.virtual_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed FX rates
INSERT INTO public.fx_rates (from_currency, to_currency, base_rate, spread_percent)
VALUES
  ('NGN', 'USD', 0.000633, 0.5000),
  ('USD', 'NGN', 1580.000000, 0.5000);

-- Realtime for cards
ALTER PUBLICATION supabase_realtime ADD TABLE public.virtual_cards;
