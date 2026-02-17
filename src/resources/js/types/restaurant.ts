export interface Prefecture {
  id: number;
  name: string;
  cities?: City[];
}

export interface City {
  id: number;
  name: string;
  prefecture?: { id: number; name: string };
}

export interface RestaurantImage {
  id: number;
  image_path: string;
}

export interface SeatType {
  id: number;
  name: string;
  type: 'counter' | 'table';
  seats_per_unit: number;
  capacity: number;
}

export interface TimeSetting {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  stay_minutes: number;
}

export interface ReviewSummary {
  text: string;
  good_points: string[];
  bad_points: string[];
  review_count: number;
  generated_at: string;
}

export interface Restaurant {
  id: number;
  name: string;
  description: string;
  city?: {
    id: number;
    name: string;
    prefecture?: { id: number; name: string };
  };
  address: string;
  nearest_station: string | null;
  latitude: number | null;
  longitude: number | null;
  max_party_size: number | null;
  images: RestaurantImage[];
  reviews_avg_rating: number | null;
  reviews_count: number;
  favorites_count: number;
  distance?: number;
  created_at: string;
}

export interface RestaurantDetail extends Restaurant {
  menu_info: string | null;
  user_id: number;
  reviews: import('./review').Review[];
  review_summary: ReviewSummary | null;
  seat_types: SeatType[];
  time_settings: TimeSetting[];
  is_favorited: boolean;
  has_reviewed: boolean;
}

export interface RestaurantSearchParams {
  keyword?: string;
  prefecture_id?: string;
  sort?: string;
  lat?: string;
  lng?: string;
  page?: number;
}
