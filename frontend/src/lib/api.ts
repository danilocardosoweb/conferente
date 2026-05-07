import axios, { AxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 60000, // 60s para suportar cold start do Render (~30s)
});

// Health check – acorda o servidor Render antes de processar
export async function wakeUpBackend(): Promise<boolean> {
  try {
    await axios.get(`${API_URL}/health`, { timeout: 60000 });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Tipos espelhando os schemas do backend
// ---------------------------------------------------------------------------

export interface DetectionParams {
  min_radius?: number;
  max_radius?: number;
  canny_low?: number;
  canny_high?: number;
  hough_param1?: number;
  hough_param2?: number;
  min_dist?: number;
  use_contours?: boolean;
  use_morphology?: boolean;
  blur_kernel?: number;
}

export interface DetectionResult {
  detected_count: number;
  confidence_score: number;
  processing_time_ms: number;
  annotated_image_base64: string;
  debug_steps: string[];
  params_used: DetectionParams;
}

export interface ReadingCreate {
  detected_count: number;
  final_count: number;
  manual_adjustment: number;
  operator?: string;
  pallet_id?: string;
  notes?: string;
  processing_params?: DetectionParams;
  confidence_score?: number;
  processing_time_ms?: number;
  thumbnail_base64?: string;
}

export interface Reading {
  id: number;
  detected_count: number;
  final_count: number;
  manual_adjustment: number;
  operator?: string;
  pallet_id?: string;
  notes?: string;
  confidence_score?: number;
  processing_time_ms?: number;
  thumbnail_base64?: string;
  created_at: string;
  updated_at: string;
}

export interface ReadingListOut {
  items: Reading[];
  total: number;
  page: number;
  page_size: number;
}

export interface DashboardStats {
  total_readings: number;
  total_profiles_counted: number;
  avg_per_reading: number;
  avg_confidence: number;
  readings_today: number;
  profiles_today: number;
}

// ---------------------------------------------------------------------------
// Funções de API
// ---------------------------------------------------------------------------

export async function detectProfiles(
  imageFile: File,
  params: DetectionParams = {}
): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("params", JSON.stringify(params));

  const { data } = await api.post<DetectionResult>("/detect/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function saveReading(payload: ReadingCreate): Promise<Reading> {
  const { data } = await api.post<Reading>("/readings/", payload);
  return data;
}

export async function listReadings(
  page = 1,
  pageSize = 20,
  palletId?: string
): Promise<ReadingListOut> {
  const params: Record<string, unknown> = { page, page_size: pageSize };
  if (palletId) params.pallet_id = palletId;
  const { data } = await api.get<ReadingListOut>("/readings/", { params });
  return data;
}

export async function updateReading(
  id: number,
  payload: Partial<ReadingCreate>
): Promise<Reading> {
  const { data } = await api.patch<Reading>(`/readings/${id}`, payload);
  return data;
}

export async function deleteReading(id: number): Promise<void> {
  await api.delete(`/readings/${id}`);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/readings/stats/dashboard");
  return data;
}
