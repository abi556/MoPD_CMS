import { listComplaints } from "./complaints-api";
import { fetchSlaAtRiskCount } from "./sla-api";

export interface DashboardKpis {
  totalOpen: number;
  triageQueue: number;
  qaReview: number;
  slaAtRisk: number;
}

async function countByStatus(status?: string): Promise<number> {
  const result = await listComplaints({ page: 1, pageSize: 1, status });
  return result.meta.total;
}

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const [totalAll, closed, triage, qa, slaAtRisk] = await Promise.all([
    countByStatus(),
    countByStatus("CLOSED"),
    countByStatus("TRIAGE"),
    countByStatus("QA_LEGAL_REVIEW"),
    fetchSlaAtRiskCount(),
  ]);

  return {
    totalOpen: Math.max(0, totalAll - closed),
    triageQueue: triage,
    qaReview: qa,
    slaAtRisk,
  };
}
