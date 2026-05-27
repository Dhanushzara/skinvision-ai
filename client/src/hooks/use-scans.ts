import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useScans() {
  return useQuery({
    queryKey: [api.scans.list.path],
    queryFn: async () => {
      const res = await fetch(api.scans.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scans");
      return res.json();
    },
  });
}

export function useScan(id: number) {
  return useQuery({
    queryKey: [api.scans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.scans.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch scan");
      return res.json();
    },
    enabled: !!id,
  });
}

export function usePatientHistory(patientId: string | null) {
  return useQuery({
    queryKey: ["patient-history", patientId],
    queryFn: async () => {
      const url = buildUrl(api.scans.history.path, { patientId: patientId! });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: !!patientId,
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { image: string | File; bodyLocation?: string; notes?: string }) => {
      let imageUrl = payload.image as string;
      if (payload.image instanceof Blob) {
        const formData = new FormData();
        formData.append("image", payload.image);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Failed to upload image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }
      const data = { imageUrl, bodyLocation: payload.bodyLocation, notes: payload.notes };
      const res = await fetch(api.scans.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message);
        }
        throw new Error("Failed to analyze image");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.scans.list.path] }),
  });
}

export function useCreateConsultation() {
  return useMutation({
    mutationFn: async (data: { scanId: number; doctorEmail?: string; message?: string }) => {
      const res = await fetch(api.consultations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create consultation");
      return res.json();
    },
  });
}

export function useSharedReport(token: string | null) {
  return useQuery({
    queryKey: ["shared-report", token],
    queryFn: async () => {
      const url = buildUrl(api.consultations.getByToken.path, { token: token! });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Report not found");
      return res.json();
    },
    enabled: !!token,
  });
}

export function useExportFHIR() {
  return useMutation({
    mutationFn: async (scanId: number) => {
      const url = buildUrl(api.export.fhir.path, { id: scanId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      return res.json();
    },
  });
}
