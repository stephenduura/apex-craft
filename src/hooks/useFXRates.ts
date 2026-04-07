import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FXRate {
  id: string;
  from_currency: string;
  to_currency: string;
  base_rate: number;
  spread_percent: number;
  effective_rate: number;
  updated_at: string;
}

export function useFXRates() {
  return useQuery({
    queryKey: ['fx-rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('*');
      if (error) throw error;
      return (data ?? []) as FXRate[];
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useFXRate(from: string, to: string) {
  const { data: rates, ...rest } = useFXRates();
  const rate = rates?.find(r => r.from_currency === from && r.to_currency === to) ?? null;
  return { rate, ...rest };
}
