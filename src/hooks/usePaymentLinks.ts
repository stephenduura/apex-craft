import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentLink {
  id: string;
  creator_id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  recipient_id: string | null;
  paid_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export function usePaymentLinks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment_links', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as PaymentLink[];
    },
    enabled: !!user,
  });
}
