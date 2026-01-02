import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useImpactStats() {
  return useQuery({
    queryKey: [api.impact.stats.path],
    queryFn: async () => {
      const res = await fetch(api.impact.stats.path);
      if (!res.ok) throw new Error("Failed to fetch impact stats");
      return api.impact.stats.responses[200].parse(await res.json());
    },
  });
}
