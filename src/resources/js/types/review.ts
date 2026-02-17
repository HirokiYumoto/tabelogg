export interface ReviewImage {
  id: number;
  image_path: string;
}

export interface Review {
  id: number;
  user?: { id: number; name: string };
  rating: number;
  comment: string;
  images: ReviewImage[];
  created_at: string;
}
