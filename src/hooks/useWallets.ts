import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useWallets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('currency', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Wallet[];
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('wallets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['wallets', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useWalletByCurrency(currency: string) {
  const { data: wallets, ...rest } = useWallets();
  const wallet = wallets?.find(w => w.currency === currency) ?? null;
  return { wallet, ...rest };
}
