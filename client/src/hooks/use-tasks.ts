import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Volunteer: Get my applications
export function useVolunteerTasks() {
  return useQuery({
    queryKey: [api.tasks.listByVolunteer.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.listByVolunteer.path);
      if (!res.ok) throw new Error("Failed to fetch your tasks");
      return api.tasks.listByVolunteer.responses[200].parse(await res.json());
    },
  });
}

// NGO: Get tasks/applications for my causes
export function useNgoTasks() {
  return useQuery({
    queryKey: [api.tasks.listByNgo.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.listByNgo.path);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.listByNgo.responses[200].parse(await res.json());
    },
  });
}

// Volunteer: Apply for a cause
export function useApplyForCause() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ causeId, startDate, endDate }: { causeId: number; startDate: Date; endDate: Date }) => {
      const url = buildUrl(api.tasks.apply.path, { causeId });
      const res = await fetch(url, {
        method: api.tasks.apply.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to apply");
      return api.tasks.apply.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByVolunteer.path] });
      toast({ title: "Applied!", description: "Thank you for volunteering." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Volunteer: Upload proof
export function useUploadProof() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, proofUrl }: { taskId: number; proofUrl: string }) => {
      const url = buildUrl(api.tasks.uploadProof.path, { id: taskId });
      const res = await fetch(url, {
        method: api.tasks.uploadProof.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl }),
      });
      if (!res.ok) throw new Error("Failed to submit proof");
      return api.tasks.uploadProof.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByVolunteer.path] });
      toast({ title: "Proof Submitted", description: "The NGO will review your contribution." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Volunteer: Opt out of a task
export function useOptOutTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to opt out");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByVolunteer.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByNgo.path] });
      toast({ title: "Opted out successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// Volunteer: Update status (e.g., mark as in_progress)
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: "pending" | "in_consideration" | "approved" | "declined" | "in_progress" | "completed" }) => {
      const url = buildUrl(api.tasks.updateStatus.path, { id: taskId });
      const res = await fetch(url, {
        method: api.tasks.updateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.tasks.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByVolunteer.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByNgo.path] });
      toast({ title: "Status Updated" });
    },
  });
}

// NGO: Approve task
export function useApproveTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: number) => {
      const url = buildUrl(api.tasks.approve.path, { id: taskId });
      const res = await fetch(url, { method: api.tasks.approve.method });
      if (!res.ok) throw new Error("Failed to approve task");
      return api.tasks.approve.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByNgo.path] });
      toast({ title: "Task Approved", description: "Volunteer hours have been recorded." });
    },
  });
}
