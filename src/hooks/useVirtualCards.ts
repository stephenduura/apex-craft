import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface VirtualCard {
  id: string;
  user_id: string;
  card_number_last4: string;
  card_holder_name: string;
  expiry_month: number;
  expiry_year: number;
  currency: string;
  status: 'active' | 'frozen' | 'cancelled';
  spending_limit: number;
  amount_spent_month: number;
  card_type: string;
  brand: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useVirtualCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['virtual-cards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as VirtualCard[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('cards-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'virtual_cards' }, () => {
        queryClient.invalidateQueries({ queryKey: ['virtual-cards'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useCreateCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardHolderName, spendingLimit }: { cardHolderName: string; spendingLimit?: number }) => {
      if (!user) throw new Error('Not authenticated');
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      const now = new Date();
      const expiryMonth = now.getMonth() + 1;
      const expiryYear = now.getFullYear() + 3;

      const { data, error } = await supabase
        .from('virtual_cards')
        .insert({
          user_id: user.id,
          card_number_last4: last4,
          card_holder_name: cardHolderName.toUpperCase(),
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          spending_limit: spendingLimit ?? 5000,
        })
        .select()
        .single();

      if (error) throw error;
      return data as VirtualCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-cards'] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; spending_limit?: number }) => {
      const { data, error } = await supabase
        .from('virtual_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as VirtualCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['virtual-cards'] });
    },
  });
}
