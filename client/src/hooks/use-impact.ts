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

export interface VolunteerImpact {
  totalHours: number;
  totalDonated: number;
  causesSupported: number;
  tasksCompleted: number;
  activeTasks: number;
  categories: { name: string; count: number }[];
  timeline: { month: string; tasks: number; donated: number }[];
}

export function useVolunteerImpact() {
  return useQuery<VolunteerImpact>({
    queryKey: ["/api/volunteer/impact"],
    queryFn: async () => {
      const res = await fetch("/api/volunteer/impact");
      if (!res.ok) throw new Error("Failed to fetch impact data");
      return res.json();
    },
  });
}
