import apiClient from './client';
import type { Restaurant, RestaurantDetail, RestaurantSearchParams, Prefecture, City } from '@/types/restaurant';

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

export interface CursorPaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
}

export async function getRestaurants(params: RestaurantSearchParams): Promise<CursorPaginatedResponse<Restaurant>> {
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

export async function getCities(prefectureId: number): Promise<City[]> {
  const { data } = await apiClient.get('/cities', { params: { prefecture_id: prefectureId } });
  return data.data;
}

export async function resolveCity(prefectureId: number, name: string): Promise<{ id: number; name: string; prefecture_id: number }> {
  const { data } = await apiClient.post('/cities/resolve', { prefecture_id: prefectureId, name });
  return data;
}

export async function reversePostalCode(prefectureId: number, cityId: number, address: string): Promise<string | null> {
  try {
    const { data } = await apiClient.get('/postal-codes/reverse', {
      params: { prefecture_id: prefectureId, city_id: cityId, address },
    });
    return data.postal_code;
  } catch {
    return null;
  }
}

export interface PostalCodeResult {
  prefecture: string;
  city: string;
  town: string;
}

export async function lookupPostalCode(code: string): Promise<PostalCodeResult | null> {
  try {
    const res = await fetch(`https://jp-postal-code-api.ttskch.com/api/v1/${code}.json`);
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json.addresses?.[0];
    if (!entry) return null;
    return {
      prefecture: entry.ja.prefecture,
      city: entry.ja.address1,
      town: entry.ja.address2,
    };
  } catch {
    return null;
  }
}
