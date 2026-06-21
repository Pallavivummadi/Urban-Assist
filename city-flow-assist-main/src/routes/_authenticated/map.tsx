import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Button } from "@/components/ui/button";
import { Hospital, Utensils, Banknote, Bus, Shield, Phone, MapPin, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({ meta: [{ title: "Map & Nearby — UrbanAssist" }] }),
  component: MapPage,
});

const CATEGORIES = [
  { key: "hospital", label: "Hospitals", icon: Hospital, type: "hospital" },
  { key: "restaurant", label: "Restaurants", icon: Utensils, type: "restaurant" },
  { key: "atm", label: "ATMs", icon: Banknote, type: "atm" },
  { key: "bus", label: "Bus stops", icon: Bus, type: "bus_station" },
  { key: "police", label: "Police", icon: Shield, type: "police" },
  { key: "emergency", label: "Emergency", icon: Phone, type: "hospital" },
] as const;

declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
  }
}

interface Place {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  rating?: number;
}

function MapPage() {
  const { coords, loading: geoLoading } = useGeolocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarker = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [activeCat, setActiveCat] = useState<(typeof CATEGORIES)[number] | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) { setReady(true); return; }
    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return;

    window.initMap = () => setReady(true);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=initMap&libraries=places&channel=${channel}`;
    s.async = true;
    document.head.appendChild(s);
    return () => { document.head.removeChild(s); };
  }, []);

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current || geoLoading) return;
    const g = window.google;
    mapInstance.current = new g.maps.Map(mapRef.current, {
      center: coords, zoom: 14, disableDefaultUI: false, mapTypeControl: false, streetViewControl: false,
    });
    userMarker.current = new g.maps.Marker({
      position: coords, map: mapInstance.current, title: "You",
      icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#3b82f6", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
    });
  }, [ready, coords, geoLoading]);

  // Update center when coords change
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setCenter(coords);
      userMarker.current?.setPosition(coords);
    }
  }, [coords]);

  async function searchNearby(cat: (typeof CATEGORIES)[number]) {
    if (!mapInstance.current || !window.google?.maps?.places) return;
    setActiveCat(cat);
    setSearching(true);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const g = window.google;
    const service = new g.maps.places.PlacesService(mapInstance.current);
    service.nearbySearch(
      { location: coords, radius: 3000, type: cat.type },
      (results: any[] | null, status: string) => {
        setSearching(false);
        if (status !== g.maps.places.PlacesServiceStatus.OK || !results) {
          setPlaces([]); return;
        }
        const out: Place[] = [];
        for (const r of results.slice(0, 20)) {
          if (!r.geometry?.location) continue;
          const lat = r.geometry.location.lat();
          const lng = r.geometry.location.lng();
          const marker = new g.maps.Marker({
            position: { lat, lng }, map: mapInstance.current, title: r.name,
          });
          markersRef.current.push(marker);
          out.push({ id: r.place_id ?? `${lat},${lng}`, name: r.name ?? "Unknown", address: r.vicinity, lat, lng, rating: r.rating });
        }
        setPlaces(out);
      }
    );
  }

  function distanceKm(lat: number, lng: number) {
    const R = 6371;
    const dLat = (lat - coords.lat) * Math.PI / 180;
    const dLng = (lng - coords.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(coords.lat*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLng/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Map & Nearby</h1>
        <p className="mt-1 text-muted-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4" /> {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c.key} variant={activeCat?.key === c.key ? "default" : "outline"} size="sm" onClick={() => searchNearby(c)} disabled={!ready || searching}>
            <c.icon className="mr-2 h-4 w-4" /> {c.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div ref={mapRef} className="h-[500px] w-full bg-muted">
            {!ready && (
              <div className="h-full grid place-items-center text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  <p className="mt-2 text-sm">Loading map…</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass rounded-2xl p-4 max-h-[500px] overflow-auto">
          <h3 className="font-semibold mb-3">{activeCat ? activeCat.label : "Pick a category"}</h3>
          {searching ? <p className="text-sm text-muted-foreground">Searching…</p> :
            places.length === 0 ? <p className="text-sm text-muted-foreground">Tap a category to find nearby places.</p> :
            <ul className="space-y-2">
              {places.map((p) => (
                <li key={p.id} className="rounded-lg border border-border/50 bg-card/40 p-3">
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.address && <p className="text-xs text-muted-foreground">{p.address}</p>}
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{distanceKm(p.lat, p.lng)} km away</span>
                    {p.rating && <span>⭐ {p.rating}</span>}
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Get directions →
                  </a>
                </li>
              ))}
            </ul>
          }
        </div>
      </div>
    </div>
  );
}
