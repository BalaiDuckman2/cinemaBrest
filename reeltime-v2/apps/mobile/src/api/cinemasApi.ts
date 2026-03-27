import { apiClient } from '../services/api';

export interface CinemaItem {
  id: string;
  name: string;
  allocineId: string;
  city: string;
}

interface CinemaApiItem {
  id: number;
  allocineId: string;
  name: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

interface CinemasApiResponse {
  data: CinemaApiItem[];
}

export async function fetchCinemas(): Promise<CinemaItem[]> {
  const response = await apiClient<CinemasApiResponse>('/api/v1/cinemas');
  return response.data.map((c) => ({
    id: c.allocineId,
    name: c.name,
    allocineId: c.allocineId,
    city: c.city,
  }));
}
