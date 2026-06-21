import { useEffect, useState } from "react";

export interface Coords { lat: number; lng: number }

export function useGeolocation(defaultCoords: Coords = { lat: 28.6139, lng: 77.2090 }) {
  const [coords, setCoords] = useState<Coords>(defaultCoords);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLoading(false); },
      (err) => { setError(err.message); setLoading(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { coords, error, loading };
}
