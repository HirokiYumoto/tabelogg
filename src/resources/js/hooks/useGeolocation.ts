import { useState, useCallback } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

// Persist coordinates across component unmount/remount
let cachedLat: number | null = null;
let cachedLng: number | null = null;

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: cachedLat,
    lng: cachedLng,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: '位置情報がサポートされていません。' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        cachedLat = position.coords.latitude;
        cachedLng = position.coords.longitude;
        setState({
          lat: cachedLat,
          lng: cachedLng,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message,
        }));
      }
    );
  }, []);

  return { ...state, requestLocation };
}
