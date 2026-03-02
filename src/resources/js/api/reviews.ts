import apiClient from './client';
import type { Review } from '@/types/review';

export async function storeReview(restaurantId: number, formData: FormData): Promise<Review> {
  const { data } = await apiClient.post(`/restaurants/${restaurantId}/reviews`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function deleteReview(reviewId: number): Promise<void> {
  await apiClient.delete(`/reviews/${reviewId}`);
}
