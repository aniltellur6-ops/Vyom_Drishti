// src/api/client.ts
const ENV_URL = (import.meta as any).env.VITE_API_URL;
const SERVER_BASE_URL = ENV_URL ? ENV_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '') : "http://localhost:8000";
const API_BASE_URL = `${SERVER_BASE_URL}/api/v1`;

export interface SystemStatus {
  status: string;
  gpu_available: boolean;
  extractor: string;
  matcher: string;
}

export interface ImageCondition {
  illumination_difference: string;
  texture: string;
  shadow_coverage: number;
  resolution_difference: string;
  feature_density: string;
  overall_difficulty: string;
  recommended_method: string;
  reason: string;
}

export interface MatchingResult {
  job_id: string;
  status: string;
  method_used?: string;
  metrics: {
    inliers: number;
    inlier_ratio: number;
    rmse: number;
    coverage: number;
    runtime: number;
    transformation: number[][];
  };
  files: {
    registered_image: string;
    overlay_image: string;
    matches_viz: string;
  };
}

export interface Experiment {
  id: string;
  name: string;
  method: string;
  status: string;
  created_at: string;
  metrics: {
    inliers: number;
    inlier_ratio: number;
    rmse: number;
    coverage: number;
    runtime: number;
  };
}

export const LunaraClient = {
  getSystemStatus: async (): Promise<SystemStatus> => {
    const res = await fetch(`${API_BASE_URL}/system/status`);
    if (!res.ok) throw new Error("Failed to fetch system status");
    return res.json();
  },

  analyzeImages: async (refFile: File, srcFile: File): Promise<ImageCondition> => {
    const formData = new FormData();
    formData.append("reference_img", refFile);
    formData.append("source_img", srcFile);

    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to analyze images");
    return res.json();
  },

  runMatching: async (refFile: File, srcFile: File, method: string = "auto"): Promise<MatchingResult> => {
    const formData = new FormData();
    formData.append("reference_img", refFile);
    formData.append("source_img", srcFile);
    formData.append("requested_method", method);
    // Add prefix and config if needed

    const res = await fetch(`${API_BASE_URL}/match`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to run matching pipeline");
    }
    return res.json();
  },

  getExperiments: async (): Promise<Experiment[]> => {
    const res = await fetch(`${API_BASE_URL}/experiments`);
    if (!res.ok) throw new Error("Failed to fetch experiments");
    return res.json();
  },

  getResultUrl: (path: string) => {
    // If the path already has the base url format handled by the backend, just prepend the server
    return `${SERVER_BASE_URL}${path}`;
  }
};
