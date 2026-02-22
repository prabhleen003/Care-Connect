import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertCause, Cause } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Fetch all causes (public view with filters)
export function useCauses(filters?: { category?: string; location?: string; urgency?: string }) {
  // Create a query string from filters
  const queryParams = new URLSearchParams();
  if (filters?.category && filters.category !== "all") queryParams.append("category", filters.category);
  if (filters?.location) queryParams.append("location", filters.location);
  if (filters?.urgency) queryParams.append("urgency", filters.urgency);

  const queryString = queryParams.toString();
  const url = `${api.causes.list.path}${queryString ? `?${queryString}` : ""}`;

  return useQuery({
    queryKey: [api.causes.list.path, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch causes");
      return api.causes.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single cause details
export function useCause(id: number) {
  return useQuery({
    queryKey: [api.causes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.causes.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch cause");
      return api.causes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Fetch causes created by the logged-in NGO
export function useNgoCauses() {
  return useQuery({
    queryKey: [api.causes.getByNgo.path],
    queryFn: async () => {
      const res = await fetch(api.causes.getByNgo.path);
      if (!res.ok) throw new Error("Failed to fetch your causes");
      return api.causes.getByNgo.responses[200].parse(await res.json());
    },
  });
}

// Create a new cause (NGO only)
export function useCreateCause() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InsertCause, "ngoId">) => {
      const res = await fetch(api.causes.create.path, {
        method: api.causes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create cause");
      return api.causes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.causes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.causes.getByNgo.path] });
      toast({ title: "Cause Created", description: "Your cause is now live for volunteers." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Update an existing cause (NGO only)
export function useUpdateCause() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ causeId, data }: { causeId: number; data: Partial<Omit<InsertCause, "ngoId">> }) => {
      const url = buildUrl(api.causes.update.path, { id: causeId });
      const res = await fetch(url, {
        method: api.causes.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update cause");
      return api.causes.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.causes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.causes.getByNgo.path] });
      queryClient.invalidateQueries({ queryKey: [api.causes.get.path] });
      toast({ title: "Cause Updated", description: "Your changes have been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Delete a cause (NGO only)
export function useDeleteCause() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (causeId: number) => {
      const url = buildUrl(api.causes.delete.path, { id: causeId });
      const res = await fetch(url, { method: api.causes.delete.method });
      if (!res.ok) throw new Error("Failed to delete cause");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.causes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.causes.getByNgo.path] });
      toast({ title: "Cause Deleted", description: "The cause has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
