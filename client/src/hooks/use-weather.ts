import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

interface Coordinates {
  lat: number;
  lng: number;
}

export function useUVIndex(coords: Coordinates | null) {
  return useQuery({
    queryKey: [api.weather.uv.path, coords?.lat, coords?.lng],
    queryFn: async () => {
      if (!coords) return null;
      
      const url = `${api.weather.uv.path}?lat=${coords.lat}&lng=${coords.lng}`;
      const res = await fetch(url, { credentials: "include" });
      
      if (!res.ok) throw new Error("Failed to fetch UV index");
      return api.weather.uv.responses[200].parse(await res.json());
    },
    enabled: !!coords,
  });
}
