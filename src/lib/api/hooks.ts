import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApi } from "./index";
import type { CreateExperimentInput, ExperimentStatus } from "./types";

export function useExperiments() {
  const { api, mode } = useApi();
  return useQuery({
    queryKey: ["experiments", mode],
    queryFn: () => api.listExperiments(),
    refetchInterval: (q) => (q.state.data?.some((e) => e.status === "running") ? 3000 : false),
  });
}
export function useDashboard() {
  const { api, mode } = useApi();
  return useQuery({ queryKey: ["dashboard", mode], queryFn: () => api.getDashboardSummary() });
}
export function useEvaluation(id: string | undefined) {
  const { api, mode } = useApi();
  return useQuery({
    queryKey: ["evaluation", mode, id],
    queryFn: () => api.getEvaluationMetrics(id as string),
    enabled: !!id,
  });
}
export function useHistory() {
  const { api, mode } = useApi();
  return useQuery({ queryKey: ["history", mode], queryFn: () => api.listHistory() });
}
export function useHealth() {
  const { api, mode } = useApi();
  return useQuery({ queryKey: ["health", mode], queryFn: () => api.health(), retry: false });
}

const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Request failed");

export function useExperimentMutations() {
  const { api } = useApi();
  const qc = useQueryClient();
  const inv = () => {
    qc.invalidateQueries({ queryKey: ["experiments"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  return {
    create: useMutation({
      mutationFn: (i: CreateExperimentInput) => api.createExperiment(i),
      onSuccess: (e) => {
        inv();
        toast.success(`Created ${e.id}`);
      },
      onError: err,
    }),
    run: useMutation({
      mutationFn: (id: string) => api.runExperiment(id),
      onSuccess: (e) => {
        inv();
        toast.success(`${e.id} started — status will update when the run reports back`);
      },
      onError: err,
    }),
    status: useMutation({
      mutationFn: (v: { id: string; status: ExperimentStatus }) =>
        api.updateExperimentStatus(v.id, v.status),
      onSuccess: (e) => {
        inv();
        toast.success(`${e.id} is now ${e.status}`);
      },
      onError: err,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.deleteExperiment(id),
      onSuccess: (_d, id) => {
        inv();
        toast.success(`Deleted ${id}`);
      },
      onError: err,
    }),
    duplicate: useMutation({
      mutationFn: (id: string) => api.duplicateExperiment(id),
      onSuccess: (e) => {
        inv();
        toast.success(`Duplicated as ${e.id}`);
      },
      onError: err,
    }),
  };
}
