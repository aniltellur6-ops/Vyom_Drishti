// src/api/client.ts
// Wait, we don't need a static BASE_URL anymore, we fetch it dynamically.
// We'll keep a fallback for local development
const FALLBACK_URL = "http://localhost:8000";
let CACHED_SERVER_URL = FALLBACK_URL;

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
    raw_reference: string;
    raw_moving: string;
    preprocessed_reference: string;
    preprocessed_moving: string;
  };
  preprocessing_metadata?: any;
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
  getLiveUrl: async (): Promise<string> => {
    try {
      // Fetch the active Cloudflare URL from our Vercel Serverless Function
      const res = await fetch("/api/url");
      const data = await res.json();
      if (data.backendUrl) {
        CACHED_SERVER_URL = data.backendUrl.replace(/\/$/, '');
        return `${CACHED_SERVER_URL}/api/v1`;
      }
    } catch (e) {
      console.warn("Failed to fetch live URL, falling back to local", e);
    }
    return `${CACHED_SERVER_URL}/api/v1`;
  },

  getSystemStatus: async (): Promise<SystemStatus> => {
    const baseUrl = await LunaraClient.getLiveUrl();
    const res = await fetch(`${baseUrl}/system/status`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!res.ok) throw new Error("Failed to fetch system status");
    return res.json();
  },

  analyzeImages: async (refFile: File, srcFile: File): Promise<ImageCondition> => {
    const baseUrl = await LunaraClient.getLiveUrl();
    const formData = new FormData();
    formData.append("reference_img", refFile);
    formData.append("source_img", srcFile);

    const res = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to analyze images");
    return res.json();
  },

  runMatching: async (refFile: File, srcFile: File, method: string = "auto", preprocessingMethod: string = "AUTO", referenceSensor: string = "AUTO", movingSensor: string = "AUTO"): Promise<MatchingResult> => {
    const baseUrl = await LunaraClient.getLiveUrl();
    const formData = new FormData();
    formData.append("reference_img", refFile);
    formData.append("source_img", srcFile);
    formData.append("requested_method", method);
    formData.append("preprocessing_method", preprocessingMethod);
    formData.append("reference_sensor", referenceSensor);
    formData.append("moving_sensor", movingSensor);
    // Add prefix and config if needed

    const res = await fetch(`${baseUrl}/match`, {
      method: "POST",
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to run matching pipeline");
    }
    return res.json();
  },

  getExperiments: async (): Promise<Experiment[]> => {
    const baseUrl = await LunaraClient.getLiveUrl();
    const res = await fetch(`${baseUrl}/experiments`, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!res.ok) throw new Error("Failed to fetch experiments");
    return res.json();
  },

  getResultUrl: (path: string): string => {
    return `${CACHED_SERVER_URL}${path}`;
  }
};
