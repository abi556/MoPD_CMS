import { apiGet } from "@/lib/api-client";

export interface ComplaintListItem {
  id: string;
  referenceNumber?: string;
  status?: string;
}

export async function fetchComplaints() {
  return apiGet<{ items: ComplaintListItem[] }>("/complaints");
}
