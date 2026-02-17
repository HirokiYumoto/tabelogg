import apiClient from './client';

export interface DashboardReservation {
  id: number;
  restaurant: { id: number; name: string } | null;
  seat_type: { id: number; name: string; type?: string } | null;
  reserved_at: string;
  end_at: string;
  number_of_people: number;
}

export interface DashboardFavorite {
  id: number;
  restaurant: {
    id: number;
    name: string;
    city: {
      name: string;
      prefecture: { name: string } | null;
    } | null;
  };
}

export interface DashboardReview {
  id: number;
  restaurant: { id: number; name: string };
  rating: number;
  comment: string;
  created_at: string;
}

export interface OwnedRestaurant {
  id: number;
  name: string;
  image: string | null;
  city: {
    name: string;
    prefecture: { name: string } | null;
  } | null;
}

export interface DashboardData {
  upcoming_reservations: DashboardReservation[];
  past_reservations: DashboardReservation[];
  past_reservations_total: number;
  favorites: DashboardFavorite[];
  reviews: DashboardReview[];
  owned_restaurants?: OwnedRestaurant[];
}

export async function getDashboard(): Promise<DashboardData> {
  const { data } = await apiClient.get('/dashboard');
  return data;
}
