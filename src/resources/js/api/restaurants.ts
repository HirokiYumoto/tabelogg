import apiClient from './client';
import type { Restaurant, RestaurantDetail, RestaurantSearchParams, Prefecture } from '@/types/restaurant';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export async function getRestaurants(params: RestaurantSearchParams): Promise<PaginatedResponse<Restaurant>> {
  const { data } = await apiClient.get('/restaurants', { params });
  return data;
}

export async function getRestaurant(id: number): Promise<RestaurantDetail> {
  const { data } = await apiClient.get(`/restaurants/${id}`);
  return data.data;
}

export async function getPrefectures(): Promise<Prefecture[]> {
  const { data } = await apiClient.get('/prefectures');
  return data.data;
}

export async function storeRestaurant(formData: FormData): Promise<RestaurantDetail> {
  const { data } = await apiClient.post('/restaurants', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function updateRestaurant(id: number, formData: FormData): Promise<RestaurantDetail> {
  formData.append('_method', 'PUT');
  const { data } = await apiClient.post(`/restaurants/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteRestaurant(id: number): Promise<void> {
  await apiClient.delete(`/restaurants/${id}`);
}
