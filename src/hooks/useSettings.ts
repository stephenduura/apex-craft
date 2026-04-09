import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserSettings {
  id: string;
  user_id: string;
  default_currency: string;
  dark_mode: boolean;
  push_notifications_enabled: boolean;
  biometric_credential_id: string | null;
  biometric_public_key: string | null;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) {
        // Settings might not exist for existing users, create them
        if (error.code === 'PGRST116') {
          const { data: newSettings, error: insertError } = await supabase
            .from('user_settings' as any)
            .insert({ user_id: user.id } as any)
            .select()
            .single();
          if (insertError) throw insertError;
          return newSettings as unknown as UserSettings;
        }
        throw error;
      }
      return data as unknown as UserSettings;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_settings' as any)
        .update(updates as any)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as UserSettings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings', user?.id], data);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update settings', description: error.message, variant: 'destructive' });
    },
  });

  return { settings, isLoading, updateSettings };
};
