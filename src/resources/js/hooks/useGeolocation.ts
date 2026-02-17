import { useState, useCallback } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
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
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
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
