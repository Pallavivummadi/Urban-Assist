import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ lat: z.number(), lng: z.number() });

function mapWeatherCode(code: number): { desc: string; icon: string } {
  if (code === 0) return { desc: "Clear Sky", icon: "01d" };
  if (code === 1 || code === 2 || code === 3) return { desc: "Partly Cloudy", icon: "02d" };
  if (code === 45 || code === 48) return { desc: "Foggy", icon: "50d" };
  if (code >= 51 && code <= 55) return { desc: "Drizzle", icon: "09d" };
  if (code >= 61 && code <= 65) return { desc: "Rainy", icon: "10d" };
  if (code >= 71 && code <= 75) return { desc: "Snowy", icon: "13d" };
  if (code >= 80 && code <= 82) return { desc: "Rain Showers", icon: "09d" };
  if (code >= 95 && code <= 99) return { desc: "Thunderstorm", icon: "11d" };
  return { desc: "Cloudy", icon: "03d" };
}

export const getWeather = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { lat, lng } = data;

    const [weatherRes, geoRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
      ),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            "User-Agent": "UrbanAssist-Web-Application"
          }
        }
      )
    ]);

    if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);
    
    const weather = await weatherRes.json();
    const geo = geoRes.ok ? await geoRes.json() : null;

    const current = weather.current;
    const currentInfo = mapWeatherCode(current.weather_code);

    let cityName = "Ambattur";
    let countryName = "IN";
    if (geo && geo.address) {
      const addr = geo.address;
      cityName = addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.county || "Unknown";
      countryName = addr.country || "IN";
    }

    const days = (weather.daily?.time ?? []).map((timeStr: string, idx: number) => {
      const wInfo = mapWeatherCode(weather.daily?.weather_code?.[idx] ?? 0);
      return {
        date: timeStr,
        min: Math.round(weather.daily?.temperature_2m_min?.[idx] ?? 0),
        max: Math.round(weather.daily?.temperature_2m_max?.[idx] ?? 0),
        icon: wInfo.icon,
        desc: wInfo.desc
      };
    });

    return {
      city: cityName,
      country: countryName,
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      wind: Math.round(current.wind_speed_10m),
      description: currentInfo.desc,
      icon: currentInfo.icon,
      sunrise: 0,
      sunset: 0,
      days,
    };
  });
