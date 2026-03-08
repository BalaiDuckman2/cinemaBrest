import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { queryKeys } from '../services/queryKeys';

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

interface AlertsResponse {
  data: AlertItem[];
}

interface CreateAlertInput {
  filmTitle: string;
  criteria?: AlertCriteria;
}

interface CreateAlertResponse {
  data: AlertItem & {
    immediateMatch?: boolean;
    matchMessage?: string;
  };
}

async function fetchAlerts(): Promise<AlertItem[]> {
  const response = await apiClient<AlertsResponse>('/api/v1/me/alertes');
  return response.data;
}

async function createAlert(input: CreateAlertInput): Promise<CreateAlertResponse> {
  return apiClient<CreateAlertResponse>('/api/v1/me/alertes', {
    method: 'POST',
    body: input,
  });
}

async function deleteAlert(id: string): Promise<void> {
  await apiClient(`/api/v1/me/alertes/${id}`, { method: 'DELETE' });
}

export function useAlerts() {
  const queryClient = useQueryClient();

  const alertsQuery = useQuery({
    queryKey: queryKeys.alerts.all,
    queryFn: fetchAlerts,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
    },
  });

  return {
    alerts: alertsQuery.data ?? [],
    isLoading: alertsQuery.isLoading,
    isError: alertsQuery.isError,
    refetch: alertsQuery.refetch,
    createAlert: createMutation.mutateAsync,
    deleteAlert: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
