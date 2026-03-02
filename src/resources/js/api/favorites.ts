import apiClient from './client';

export async function addFavorite(restaurantId: number): Promise<void> {
  await apiClient.post(`/restaurants/${restaurantId}/favorites`);
}

export async function removeFavorite(restaurantId: number): Promise<void> {
  await apiClient.delete(`/restaurants/${restaurantId}/favorites`);
}
