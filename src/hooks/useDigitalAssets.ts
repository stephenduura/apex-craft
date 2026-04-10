import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface DigitalAssetWallet {
  id: string;
  user_id: string;
  asset: string;
  network: string;
  balance: number;
  wallet_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DigitalAssetTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: string;
  asset: string;
  amount: number;
  ngn_amount: number | null;
  rate_used: number | null;
  fee_amount: number;
  status: string;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function useDigitalAssets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['digital-asset-wallets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_asset_wallets')
        .select('*')
        .order('asset', { ascending: true });
      if (error) throw error;
      return (data ?? []) as DigitalAssetWallet[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('digital-assets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digital_asset_wallets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['digital-asset-wallets', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useAssetTransactions(limit = 20) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['digital-asset-transactions', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_asset_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as DigitalAssetTransaction[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('digital-asset-txns-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'digital_asset_transactions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['digital-asset-transactions', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}
