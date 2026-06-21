import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWeather } from "@/lib/weather.functions";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Droplets, Wind, Sun, Sunset, Thermometer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({ meta: [{ title: "Weather — UrbanAssist" }] }),
  component: WeatherPage,
});

function WeatherPage() {
  const { coords, error: geoErr } = useGeolocation();
  const weatherFn = useServerFn(getWeather);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weather", coords.lat.toFixed(2), coords.lng.toFixed(2)],
    queryFn: () => weatherFn({ data: coords }),
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Weather</h1>
        <p className="mt-1 text-muted-foreground">{geoErr ? "Using default location — enable location access for live data." : "Live forecast for your current location."}</p>
      </div>

      {isLoading && <div className="glass rounded-2xl p-10 text-center text-muted-foreground">Loading weather…</div>}
      {isError && <div className="glass rounded-2xl p-10 text-center text-destructive">{(error as Error)?.message || "Couldn't load weather"}</div>}

      {data && (
        <>
          <div className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
            <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <p className="text-sm text-muted-foreground">{data.city}{data.country ? `, ${data.country}` : ""}</p>
                <div className="mt-2 flex items-center gap-3">
                  <img src={`https://openweathermap.org/img/wn/${data.icon}@4x.png`} alt="" className="h-28 w-28 -my-4" />
                  <div>
                    <p className="text-6xl font-bold">{data.temp}°</p>
                    <p className="text-lg text-muted-foreground capitalize">{data.description}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Tile icon={Thermometer} label="Feels like" value={`${data.feelsLike}°C`} />
                <Tile icon={Droplets} label="Humidity" value={`${data.humidity}%`} />
                <Tile icon={Wind} label="Wind" value={`${data.wind} km/h`} />
                <Tile icon={Sun} label="Sunrise" value={new Date(data.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                <Tile icon={Sunset} label="Sunset" value={new Date(data.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">7-day forecast</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {data.days.map((d) => (
                <div key={d.date} className="glass rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                  <img src={`https://openweathermap.org/img/wn/${d.icon}@2x.png`} alt="" className="mx-auto h-14 w-14 -my-2" />
                  <p className="text-xs text-muted-foreground capitalize">{d.desc}</p>
                  <p className="mt-1 font-semibold">{d.max}° <span className="text-muted-foreground font-normal">/ {d.min}°</span></p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold">Smart alerts</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.temp >= 35 && <li>🌡️ Heat advisory — stay hydrated and avoid midday sun.</li>}
              {data.temp <= 5 && <li>🥶 Cold alert — bundle up before heading out.</li>}
              {data.wind >= 30 && <li>💨 Strong winds expected — secure loose items.</li>}
              {data.humidity >= 85 && <li>💧 High humidity — air may feel heavier than usual.</li>}
              {/rain|storm|drizzle|snow/i.test(data.description) && <li>☔ Precipitation likely — bring an umbrella.</li>}
              {data.temp > 5 && data.temp < 35 && data.wind < 30 && data.humidity < 85 && !/rain|storm|drizzle|snow/i.test(data.description) && (
                <li>✨ Great conditions — perfect time to head out.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
