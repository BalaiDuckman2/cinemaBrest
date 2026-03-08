import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../services/api';
import { queryKeys } from '../services/queryKeys';
import { useAuthStore } from '../stores/authStore';

export interface AlertCriteria {
  cinemaId?: string;
  version?: 'VF' | 'VO' | 'VOST';
  minTime?: string;
}

export interface AlertItem {
  id: string;
  filmTitle: string;
  criteria: AlertCriteria;
  isActive: boolean;
  status: 'active' | 'triggered' | 'expired';
  createdAt: string;
  triggeredAt: string | null;
}

export interface CreateAlertInput {
  filmTitle: string;
  criteria?: AlertCriteria;
}

interface AlertsResponse {
  data: AlertItem[];
}

interface CreateAlertResponse {
  data: AlertItem & {
    immediateMatch?: boolean;
    matchMessage?: string;
  };
}

export function useAlerts() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.alertes.all,
    queryFn: () => apiFetch<AlertsResponse>('/api/v1/me/alertes'),
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAlertInput) =>
      apiFetch<CreateAlertResponse>('/api/v1/me/alertes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/v1/me/alertes/${id}`, { method: 'DELETE' }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.alertes.all });
      const previous = queryClient.getQueryData<AlertsResponse>(queryKeys.alertes.all);
      queryClient.setQueryData<AlertsResponse>(queryKeys.alertes.all, (old) => ({
        data: (old?.data ?? []).filter((a) => a.id !== id),
      }));
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.alertes.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alertes.all });
    },
  });

  return {
    alerts: query.data?.data ?? [],
    isLoading: query.isLoading,
    createAlert: createMutation.mutateAsync,
    deleteAlert: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
